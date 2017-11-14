/**
 * This variable provides the model data for our application. All that's needed to alter what pages exist in the
 * dashboard, what sections exist in each page, what components are shown in each section, what visualization to
 * display in each component, or what query to use as the data source for a component is to modify this object.
 */
 
function getTitle(){			
  if(location.hash.split('&')[1] != undefined) {
    return 'Site Server Details for Store No #' + location.hash.split('&')[1].split('=')[1] + ', Server ' + '<??>';
  } else {
	return 'Site Server Details';
  }
}
        
var appModel = {
	pages: {
    mapview: {
			name: 'Map view',
      title: 'RFID Servers Map',
			sections:[
				{
					components: [
						{
							query: 'SELECT * FROM RFIDMetrics',
							visualizationType: 'map',
							visualizationConfig: {
								title: 'RFID Servers Map',
								categoryField: 'category',
								valueField: 'totalInventory',
								legend: {
									align: 'right',
									verticalAlign: 'middle',
									layout: 'vertical'
								}
							},
							colSpan: 10,
							height: 450
						}
					]
				}
			]
		},
		serverlistview: {
			name: 'Server List',
			title: 'Server List',
			sections:[
				{
					components: [
						{
							query: 'SELECT * FROM LogDetails',
							visualizationType: 'textview',
							visualizationConfig: {displayItem:[
								['', 'ServerName',''],
								['', 'ServerIP',''],
								['Store Number:', 'StoreNumber','RECT'],
								['Last Updated', 'SrvStatDateTime',''],
								['CPU:', 'CPU',''],
								['Memory:', 'Memory',''],
								['Disk C Free:', 'CDrive',''],
								['Disk D Free:', 'DDrive',''],
								['Disk E Free:', 'EDrive',''],								
								['SQL Memory:', 'SQLMemory',''],
								['Truevue:', 'Truevue',''],
								['Fulfillment Sites','','CIRC'],
								['Error:', 'ErrorCount','ECLIP-red'],
								['Debug:', 'DebugCount','ECLIP-yellow'],
								['Info:', 'InfoCount','ECLIP-orange'],
								['Fine:', 'FineCount','ECLIP-green']
							]},
							colSpan: 6,
							height: 800
						}
					]
				}
			]
		},
		serverdetailsview: {
			name: 'Server Metrics',
        	title: getTitle(),
			sections: [
				{
					components: [
						{
							//query: 'SELECT SrvStatDateTime, CPU, Memory, CDrive, SQLMemory, Truevue FROM D2C_BAM_RFID_OPEN_ALERTS WHERE ServerName = \'<??>\'',
							query: 'SELECT TS, FREE_CPU, FREE_MEM, FREE_C_DRIVE, FREE_E_DRIVE FROM D2C_BAM_RFID_SERVER_METRICS WHERE SERVER_NAME = \'<??>\'',
							//query: 'SELECT SrvStatDateTime, CPU, Memory FROM ItemsSales WHERE ServerName = \'ME001ASRFI21\' WHEN SrvStatDateTime BETWEEN now()-seconds(120) AND now()',
							//query: 'SELECT * from LogDetails',
							visualizationType: 'chart',
							visualizationConfig: {
								title: 'Server Performance',
								plotType: 'column',
								options: {
									tooltip: {
										formatter: function() {
											return this.y;
										}
									},
									xAxis:{
										title: {
											text: 'Time (EST)'
										},
										
										type: 'category',//, //time
										labels: {
        formatter: function() {
              return Highcharts.dateFormat('%m/%d/%Y %H:%M', this.value);
         }
},
										//tickInterval: 1 * 1000 * 60
										//minRange: 180000
									},
									yAxis: [
										{
										title: {
											text: '% Used'
										}},
										/*{
											title: {
												text: 'Free CPU',
												style: {
													color: '#0000B0'
												}
											},
											labels: {
												style: {
													color: '#0000B0'
												}
											}
										},
										{
											title: {
												text: 'Free Memory',
												style: {
													color: '#00B000'
												}
											},
											labels: {
												format: '${value}',
												style: {
													color: '#00B000'
												}
											},
											opposite: true
										}*/
									]
								},
								categoryField: 'TS',
								series: [
									{
										name: 'CPU',
										valueField: 'FREE_CPU',
										color: '#027692',
										pointInterval:  1 * 1000 * 60,
            							//pointStart: Date.UTC(2016, 12, 07, 18, 8, 0, 0),
										data:[]
										/*data:[	['2016-12-07 18:08:02', 10], 
												['2016-12-07 18:09:02', 20], 
												['2016-12-07 18:10:02', 30]]*/
									},
									{
										name: 'Memory',
										valueField: 'FREE_MEM',
										color: '#911D7F',
										pointInterval:  1 * 1000 * 60,
           								//pointStart: Date.UTC(2016, 12, 07, 18, 8, 0, 0),
										//yAxis: 1,
										data:[]
										/*data:[	['2016-12-07 18:08:02', 40], 
												['2016-12-07 18:09:02', 50], 
												['2016-12-07 18:10:02', 60]]*/
									},
									{
										name: 'CDrive',
										valueField: 'FREE_C_DRIVE',
										color: '#CCC',
										pointInterval:  1 * 1000 * 60,
           								//pointStart: Date.UTC(2016, 12, 07, 18, 8, 0, 0),
										//yAxis: 1,
										data:[]
										/*data:[	['2016-12-07 18:08:02', 45], 
												['2016-12-07 18:09:02', 55], 
												['2016-12-07 18:10:02', 65]]*/
									},
									{
										name: 'EDrive',
										valueField: 'FREE_E_DRIVE',
										color: '#A9A9A9',
										pointInterval:  1 * 1000 * 60,
           								//pointStart: Date.UTC(2016, 12, 07, 18, 8, 0, 0),
										//yAxis: 1,
										data:[]
										/*data:[	['2016-12-07 18:08:02', 45], 
												['2016-12-07 18:09:02', 55], 
												['2016-12-07 18:10:02', 65]]*/
									}
								]
							},
							colSpan: 12,
							height: 400
						}
					]
				},
				{
					components: [
						{
							query: 'select * from D2C_BAM_RFID_OPEN_ALERTS WHERE SITE = \'<??>\'',
							visualizationType: 'table',
							visualizationConfig: {
								title: 'Trend Detail',
								fieldNameToTitleMap: {
									
								}
						    },		
							color: '#0000B0',
							colSpan: 12,
							height: 300
						}
					]
				}

			]
		}
	}
};