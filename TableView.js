var TableView = (function($){
  'use strict';
  /**
   * A live-updating HTML table view.
   * @class TableView
   * @param {LiveViewQueryService.LiveQueryModel} model The model to be used to drive data in this View
   * @param {Element} element The the DOM element that this visualization should render in.
   * @param {Object} [config] An object containing the parameters used to configure this Table
   * @param {Object} [config.fieldNameToTitleMap] Object that maps tuple field name to the value to use as the Table column header. Like avgMonthyIncome: 'Average Monthly Income'
   */
  function TableView(model, element, config){
    this.model = model;
    this.schema = null;
    this.element = element;
    this.config = config || {};

    //Subscribe to model updates so we can update the table view
    if(model instanceof LiveViewQueryService.LiveQueryModel){
      model.addSchemaListener(this.handleSchemaSet, this);
      model.addInsertListener(this.handleDataAdded, this);
      model.addUpdateListener(this.handleDataUpdated, this);
      model.addDeleteListener(this.handleDataRemoved, this);
    }
    else{
      console.error('[ERROR] TableView.constructor - The provided model is not a LiveQueryModel. Data will likely not be displayed for this TableView.');
    }

    //Build the table view and add it to the DOM, keep references to DOM elements to simplify handling of query events
    this.container = $('<div class="table-responsive"></div>');
    this.table = $('<table id="dataTable" class="table table-striped"></table>');
    this.tableHead = $('<thead></thead>');
    this.tableBody = $('<tbody></tbody>');

    this.table.append(this.tableHead);
    this.table.append(this.tableBody);
    this.container.append(this.table);
    $(element).append(this.container);
  }

  TableView.prototype = {
    constructor: TableView,
    /* return value in mm-dd/yyyy hh:mm:ss format is value if timestamp else return as it is */   
    timestamp2Date: function(value) {
      var isDateField = (typeof(value) == 'number') && (value.toString().length > 10);
      
      if (!isDateField) return value;     
      
      var date = new Date(value);
      /*var day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
      var month = (date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : date.geMonth() + 1;
      var hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
      var minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
      var seconds = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
      
      return date.getFullYear() + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;*/
      
      var hours = date.getHours();
        var minutes = date.getMinutes();
      var ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      minutes = minutes < 10 ? '0'+minutes : minutes;
      var strTime = hours + ':' + minutes + ' ' + ampm;
      
      return date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear() + ",  " + strTime + " ET";
      
      
    },
    handleSchemaSet: function(schema){
      //An array to store the <th> elements that will be used in the header row
      var self = this;
      var cells = [];
      var columns = [];
      //A map that allows us to use something other than the fieldName as the column header text
      var titleMap = this.config.fieldNameToTitleMap || {};

      this.schema = schema;
      
      if (this.config.fieldsToShow) {
         var fieldsToShow = [];
         
         this.config.fieldsToShow.forEach(function(field) {
           for (var i = 0; i < self.schema.fields.length; i++) {
             if (field === self.schema.fields[i].name) {
                 fieldsToShow.push(self.schema.fields[i]);
             }
           }
         });
         this.schema.fields = fieldsToShow;
      }
      
      //Create a column header for each of the fields defined in the schema
      schema.fields.forEach(function(schemaField){
        cells.push('<th style="vertical-align: top;">' + (titleMap[schemaField.name] || schemaField.name) + '</th>');
        columns.push({ title: titleMap[schemaField.name] || schemaField.name });
      });
      this.tableHead.append('<tr>' + cells.join('') + '</tr>');
      
      this.compareTable = [];
      this.dtable = $('#dataTable').dataTable(scrollY: "200px", scrollCollapse: true,
      { "dom": '<"top"lfip>rt<"clear">', sPaginationType: "full_numbers", "pageLength": 7, "data": this.compareTable, "columns": columns });   
    },
    handleDataAdded: function(tuple){
      //An array to store the <td> elements that will be used in the data row
      var cells = [];
      var this_ = this;
      var values = [];
      
         this.schema.fields.forEach(function(schemaField){ 
         		//fieldConfig: {ShipByDate: [{onlyDate: true}]},
         		if(this_.config.fieldConfig && this_.config.fieldConfig[schemaField.name]) {
         			if(this_.config.fieldConfig[schemaField.name][0].onlyDate) {
         			console.log('thisconfig.fieldConfig[schemaField.name]' + JSON.stringify(this_.config.fieldConfig[schemaField.name]));
         			var dt = this_.timestamp2Date(tuple.fieldMap[schemaField.name]).split(',')[0];
         			cells.push('<td>' + dt + '</td>');
         			values.push(dt);
         			}
         			
         		} else {
            cells.push('<td>' + this_.timestamp2Date(tuple.fieldMap[schemaField.name]) + '</td>');
            values.push(this_.timestamp2Date(tuple.fieldMap[schemaField.name]));
            }
         });
      
      this.tableBody.append('<tr id="tuple_' + tuple.id + '">' + cells.join('') + '</tr>');
      this.dtable.fnAddData(values);
      
      
    },
    handleDataUpdated: function(tuple){
      var cell, //the cell element whose value needs to be updated
        fieldValue, //the new value to set in the cell
        fields = this.schema.fields, //short-hand reference to the schema's fields array
        updatedRow = $('#tuple_' + tuple.id); //the table row that contains the cell to update

      //for each updated field in the tuple, locate its table cell and update the value
      var this_ = this;
      for(var i = 0; i < fields.length; i++){
        fieldValue = this_.timestamp2Date(tuple.fieldMap[fields[i].name]);
        if(typeof(fieldValue) !== 'undefined'){
          cell = updatedRow.find('td').eq(i);
          if(cell.length){
            cell.html(fieldValue);
          }
        }
      }
    },
    handleDataRemoved: function(tuple){
      $('#tuple_' + tuple.id).remove();
    },
    buildTooltipData: function(tooltipConfig, tuple) {
      var tooltip = { cols: [], values: []};
      var self = this;
      tooltipConfig = tooltipConfig || [];
      
      tooltipConfig.forEach(function (record_) {
        tooltip.cols.push(record_.colTitle);
        tooltip.values.push(self.timestamp2Date(tuple[record_.lvFieldName]));
      });
      return tooltip
  }
  };

  return TableView;
})(jQuery);
