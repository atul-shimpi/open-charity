/* global FooTable */
import app from 'app-module';
import { availity } from 'availity-angular';
import uiRouter from 'angular-ui-router';
import * as $ from 'jquery';
import angular from 'angular';
import '../common/apis/api-existing-pref';
import jQuery from 'jquery';
import recipCol from './recpientConfig/footable_Columns.json';
import '../index.less';
import './taxidNpiValidation-resource';
import 'babel-polyfill';
/* eslint-disable */
class SetPreference {

  constructor(dashboard, $state, avUsersResource, avOrganizationsResource, $timeout, taxidNpiValidationResource, $interval) {
    this.di = {dashboard, $state, avUsersResource, avOrganizationsResource, $timeout, taxidNpiValidationResource, $interval};
    this.selectedOrganization = null;
    this.showRecipients = false;
    this.recpAdmin = null;
    this.recpUserAdmin = null;
    this.recpUser = null;
    this.orgId = null;
    this.roleIdAdmin = 50;
    this.roleIdUserAdmin = 52;
    this.permId = 7321;
    this.roleIdPat360 = 81;
    this.npiRowArray = null;
    this.currentNpi = null;
    this.allNpi = null;
    this.self = null;
    this.chekData = [];
    this.allData = [];
    this.self = this;
    this.taxIdSelected = false;
    this.disableNpi = true;
    this.recpSelected = 0;
    this.recpSelEachNpi = [];
    this.isRecpSelected = false;
    this.displaySizesSeq = [10, 20, 50, 100];
    this.displaySize = 10;
    this.iniiValue = 0;
    this.multipleNpiFlag = 'Y';
    this.prevFlowInd = false;
    this.tempRevFlow = false;
    this.existingPrefTaxIdArray = [];
    this.isExistingPrefTaxId = false;
    this.additionFlow = false;
    this.isViewModeAdditonalNPIs = false;
    this.carePlanNotif = false;
    this.recpErrors = null;
    this.addFlowExisRecp = [];
    this.maxRecpAllwd = null;
    // this is mock data this will be replaced by service calls
    if (this.di.dashboard.taxIds.length > 0) {
      this.taxIds = this.di.dashboard.taxIds;
      this.existingPrefTaxIdArray = this.di.dashboard.existingPrefTaxIdArray;
    } else {
      // this is for temporary purpose.
      this.taxIds = [123456879, 123456780, 123456879, 123456781, 123456872, 123456783, 123456874, 123456785, 123456876, 123456787, 311079309];
    }
    this.oldTaxId = null;
    this.isPrevious = false;
    this.selectedUserId = [];
    this.isFromPrevious = true;
    this.isYes = 'yes';
    this.isExistingPreferences = 'yes';

    $('#requestForm').on('keyup keypress', function(e) {
      const keyCode = e.keyCode || e.which;
      if (keyCode === 13) {
        e.preventDefault();
        return false;
      }
    });
    this.flag = true;
    this.continueEnabled = true;
    this.validationNPIArray ={};
    this.errorStatus = 0;
  }

  init() {
    this.npiLimitMsg = "Maximum of 10 NPIs are allowed per submission." +
      " Once this preference is saved, additional NPIs can be added from the Dashboard.";
    this.isFirstNpiRowFilled = false;
    this.showRecipients = false;
    this.taxIdSelected = false;
    this.selectedOrganization = this.di.dashboard.selectedOrganization;
    this.selectedNotificationType = this.di.dashboard.selectedPrefType.name;
    this.orgId = this.di.dashboard.selectedOrganization.id;
    this.carePlanNotif = this.di.dashboard.carePlanNotif;
    this.maxRecpAllwd = this.di.dashboard.maxRecpAllwd;
    if (this.tempRevFlow === true) {
      this.taxIdSelected = true;
      // this.isFromPrevious = true;
      this.enableNpiOnPrev();
    } else {
      this.taxId = null;
      this.npiRowArray = [{'npi0': '', 'npi1': '', 'npi2': '', 'npi3': '', 'npi4': '', 'isTopButton': true},
        {'npi0': '', 'npi1': '', 'npi2': '', 'npi3': '', 'npi4': '', 'isTopButton': true}];
    }
    this.allData = [];
    this.chekData = [];
    this.taxIds = this.di.dashboard.taxIds;
    this.existingPrefTaxIdArray=this.di.dashboard.existingPrefTaxIdArray;
    this.isExistingPrefTaxId = false;
    $(document).on('keydown', function(e){
      const $target = $(e.target || e.srcElement);
      if (e.keyCode === 8 && !$target.is('input,[contenteditable="true"],textarea')) {
        e.preventDefault();
      }
    });
    $('#requestForm').on('keyup keypress', function(e) {
      const keyCode = e.keyCode || e.which;
      if (keyCode === 13) {
        e.preventDefault();
        return false;
      }
    });
  }
  enableNpiOnPrev() {
    const self = this;
    angular.element(document).ready(function () {
      for (let z = 0; z < self.npiRowArray.length; z++) {
        for (let y = 0; y < 5; y++) {
          let npiId = 'npi' + z + '_' + y;
          let npiNextId =  'npi' + z + '_' + (y+1);
          if (document.getElementById(npiId) !== null && document.getElementById(npiId).value !== '')
            document.getElementById(npiId).disabled = false;
          if (y+1 <5 &&  document.getElementById(npiId).value !== '') {
            document.getElementById(npiNextId).disabled = false;
            document.getElementById(npiNextId).focus();
          }
        }
      }

    });
  }

  async onKeyUp(index, secondIndex, requestForm){
  const element = document.getElementById('npi' + index + '_' + (secondIndex));
  const errorMessage = document.getElementById('npiError' + index + '_' + (secondIndex));
  const spinnerIconId = document.getElementById('npiSpinner' + index + '_' + (secondIndex));

  document.getElementById('npiContBtn').disabled = true;
  // $('p:contains("Duplicate NPI")').text('');
  let valid = 0;
  let errString = '#' + 'npiError' + index + '_' + (secondIndex);
  let replacedDuplicateElement = '<p id="npiError'+index + '_' + (secondIndex)+'" data-av-val-container style="color: #c7254e">Duplicate NPI</p>';
  let replacedInvalidElement = '<p id="npiError'+index + '_' + (secondIndex)+'" data-av-val-container style="color: #c7254e">Invalid NPI/Tax Id Relationship</p>';
  let replacedSystemError = '<p id="npiError'+index + '_' + (secondIndex)+'" data-av-val-container style="color: #c7254e">System Error. Please try again later.</p>';
  let rule1 = true;// valid npi or not     element.value form valid
  let rule2 = true; //whether duplicate npi   element.value  and duplicate
  let rule3= true; //service call              element.value and service call
    if (index === 0 && secondIndex === 4) {
      index = 1;
      secondIndex = -1;
    }
    const nextElement = document.getElementById('npi' + index + '_' + (secondIndex + 1));
  if(element.value && requestForm.$valid) {
    rule1 = true;
    rule2 = !this.isDuplicateNpiPresent(element.value);
    spinnerIconId.style.visibility = 'visible';
      // await this.sleep(7000);
    valid = await this.isTaxidNpiValid(element.value);

    if (valid === 1) {
      rule3 = true;
    } else {
      rule3 = false;
    }
    spinnerIconId.style.visibility = 'hidden';
  } else {
    if (! requestForm.$valid) {
      rule1 = false;
    } else {
      rule1 = true;
    }
  }
  let npiRule = rule1 && rule2 && rule3;
  // if (element.value && )
  let key = 'npi' + index + '_' + (secondIndex);

  this.validationNPIArray[key] = npiRule;

  let isCustomErrorAbsent = true;
  const self = this;
  Object.keys(this.validationNPIArray).forEach(function(currentKey) {
    isCustomErrorAbsent =  isCustomErrorAbsent && self.validationNPIArray[currentKey];
  });

  if (isCustomErrorAbsent) {
    this.continueEnabled = true;
  } else {
    this.continueEnabled = false;
  }
  // this.$apply();

  if (this.continueEnabled) {
    if (this.isContinueEnabled(requestForm)){
      document.getElementById('npiContBtn').disabled = false;
    } else {
      document.getElementById('npiContBtn').disabled = true;
    }
  } else {
    document.getElementById('npiContBtn').disabled = true;
  }
  if (requestForm.$valid) {
    if (element.value) {
      if (this.isDuplicateNpiPresent(element.value)) {
        element.style.borderColor = '#931b1d';
        element.style.backgroundColor = '#fbcbc8';
        // requestForm.$setValidity(false);
        $(errString).replaceWith(replacedDuplicateElement);
        return;
      } else {
        // this.isTaxidNpiValid(element.value);
        this.flag = rule3;
        if (this.flag) {
          $(errString).text('');
          element.style.borderColor = '#ccc';
          element.style.backgroundColor = '#fff';
          if (nextElement) nextElement.disabled = false;
          this.hasNpisLimitPerSubmissionReached = self.getNpiEnteredCount() >= 10;
          if (nextElement) {
            nextElement.focus();
            nextElement.disabled = (self.isViewModeAdditonalNPIs) && (self.getNpiEnteredCountForAddNpisFlow() >= 100);
          }
        } else {
          element.style.borderColor = '#931b1d';
          element.style.backgroundColor = '#fbcbc8';
          // requestForm.$setValidity(false);
          if (valid === 2) {
            $(errString).replaceWith(replacedInvalidElement);
          }
          if (valid === 0) {
            $(errString).replaceWith(replacedSystemError);
          }
          if (valid === 3) $(errString).replaceWith(replacedDuplicateElement);
          return;
        }
      }
    } else {
      $(errString).text('');
      element.style.borderColor = '#ccc';
      element.style.backgroundColor = '#fff';
      // requestForm.$setValidity(true);
      return;
    }

  } else {
    $(errString).text('Invalid NPI');
    $(errString).on( "mouseover", function(e){
      if (e.target.innerHTML === 'Invalid NPI') {
        e.target.innerHTML = 'Enter a valid NPI containing 10 numeric digits and beginning with a 1, 2, 3, or 4' ;
      }
    });
    $(errString).on( "mouseout", function(e){
      if (e.target.innerHTML === 'Enter a valid NPI containing 10 numeric digits and beginning with a 1, 2, 3, or 4') {
        e.target.innerHTML = 'Invalid NPI' ;
      }
    });
    element.style.borderColor = '#931b1d';
    element.style.backgroundColor = '#fbcbc8';
    // requestForm.$setValidity(false);
    return;
  }
}

  getNpiEnteredCount() {
    let count = 0;
    this.npiRowArray.forEach(function (npiRow) {
      count = npiRow.npi0.length > 0 ? count + 1 : count;
      count = npiRow.npi1.length > 0 ? count + 1 : count;
      count = npiRow.npi2.length > 0 ? count + 1 : count;
      count = npiRow.npi3.length > 0 ? count + 1 : count;
      count = npiRow.npi4.length > 0 ? count + 1 : count;
    });
    return count;
  }
  showNPIInputBox(inputBoxIndex) {
    if (!this.isViewModeAdditonalNPIs || !this.existingNpis) return true;

    return parseInt(this.existingNpis.length + inputBoxIndex + 1) <= 100;
  }
  getNpiEnteredCountForAddNpisFlow() {
    let count = 0;
    this.npiRowArray.forEach(function (npiRow) {
      count = npiRow.npi0.length > 0 ? count + 1 : count;
      count = npiRow.npi1.length > 0 ? count + 1 : count;
      count = npiRow.npi2.length > 0 ? count + 1 : count;
      count = npiRow.npi3.length > 0 ? count + 1 : count;
      count = npiRow.npi4.length > 0 ? count + 1 : count;
    });
    return this.existingNpis.length + count;
  }
  isDuplicateNpiPresent (npiValue) {
    let duplicateCount = 0;
    for (let i=0; i < this.npiRowArray.length; i++) {
      if (npiValue === this.npiRowArray[i].npi0) {
        duplicateCount++;
      }
      if (npiValue === this.npiRowArray[i].npi1) {
        duplicateCount++;
      }
      if (npiValue === this.npiRowArray[i].npi2) {
        duplicateCount++;
      }
      if (npiValue === this.npiRowArray[i].npi3) {
        duplicateCount++;
      }
      if (npiValue === this.npiRowArray[i].npi4) {
        duplicateCount++;
      }
      if (duplicateCount > 1) {
        return true;
      }
    }
    return false;
  }

  async isTaxidNpiValid (npiValue) {
      let errorStaus = 0;
     const successCallback = function (response) {
        if (response.data.relations[0].relation === 'valid') {
          return 1;
        } else {
          return (response.data.relations[0].relation === 'duplicate') ? 3 : 2;
        }
      }

      const errorCallback = function (error) {
         return 0;
      }
      let paramData = {
        "orgid" : this.selectedOrganization.id,
        "preftypeid" : this.di.dashboard.selectedPrefType.id,
        "relations" : [
          {
            "taxid" : this.isViewModeAdditonalNPIs ? this.taxId : this.taxId.number,
            "npi" : npiValue
          }
        ]
      }
      this.errorStatus = await this.di.taxidNpiValidationResource.create(paramData).then(successCallback, errorCallback).then(response => {
        return response;
    });
    return this.errorStatus;
  }
  isContinueEnabled(requestForm){
    // check if atleast one valid npi is entered
    let isAtleastOneNPIPresent = false;
    let contButtDis = false;
    for (let i = 0; i < this.npiRowArray.length; i++) {
      const isAtleastOneNPIPresentInRow = this.npiRowArray[i].npi0 || this.npiRowArray[i].npi1 || this.npiRowArray[i].npi2 || this.npiRowArray[i].npi3
        || this.npiRowArray[i].npi4;
      isAtleastOneNPIPresent = isAtleastOneNPIPresent || isAtleastOneNPIPresentInRow;
    }

    // check if taxId is entered
    let isTaxIdPresent = false;
    if (this.taxId){
      isTaxIdPresent = true;
    }
    if (this.tempRevFlow === true && requestForm.$valid && isTaxIdPresent && isAtleastOneNPIPresent) {
      document.getElementById('recpContBtn').disabled = false;
      document.getElementById('npiContBtn').disabled = false;
      contButtDis = true;
    } else {
      contButtDis = requestForm.$valid && isTaxIdPresent && isAtleastOneNPIPresent;
    }
    if (this.isRecpSelected) {
       // contButtDis = false;
      document.getElementById('recpContBtn').disabled = false;
    }
    return contButtDis;
  }

  isAddEnabled(requestForm, index){
    const condition = this.npiRowArray[index].npi0 && this.npiRowArray[index].npi1 && this.npiRowArray[index].npi2
      && this.npiRowArray[index].npi3 && this.npiRowArray[index].npi4 && this.npiRowArray[index].buttonEnabled;
    if (condition && requestForm.$valid && index < 5) {
      return true;
    }
    return false;
  }

  onPrevious() {
    this.taxIdSelected = false;
    this.di.$state.go('app.dashboard', {taskTodo: 'continue' }, { location: false });
  }
  onPrev() {
    this.taxIdSelected = false;
    this.showRecipients = false;
    if (this.disableNpi === false) {
      this.allNpi.forEach(function(indNpi) {
        // document.getElementById(indNpi).style.color = '#337ab7';
        document.getElementById(indNpi).style.color = 'dimgrey';
        document.getElementById(indNpi).style.textDecoration = 'underline';
      });
    } else {
      this.allNpi.forEach(function(indNpi) {
        document.getElementById(indNpi).style.color = 'dimgrey';
        document.getElementById(indNpi).style.textDecoration = 'none';
      });
    }
    this.di.$state.go('app.setpreference', {taskTodo: 'continue' }, { location: false });
  }
  onPrevAddFlow() {
    this.taxIdSelected = false;
    this.showRecipients = false;
    this.additionFlow = false;
    this.taxId = null;
    this.npiRowArray = [{'npi0': '', 'npi1': '', 'npi2': '', 'npi3': '', 'npi4': '', 'isTopButton': true}];
    this.showRecipients = false;
    this.tempRevFlow = false;
    this.di.$state.go('app.dashboard', {taskTodo: 'continue' }, { location: false });
  }
  onCancel(){
    $('#statusModal').modal('hide');
    $('.body').removeClass('modal-open');
    $('.modal-backdrop').remove();
    this.showRecipients = false;
    this.taxId = null;
    this.npiRowArray = [{'npi0': '', 'npi1': '', 'npi2': '', 'npi3': '', 'npi4': '', 'isTopButton': true}];
    this.di.$state.go('app.dashboard', {taskTodo: 'reset'}, { location: false });
  }
  onContinue(){
    window.scrollTo(0, 0);
    this.displaySize = 10;
    if (typeof FooTable.get('#recpPref')=='object' && !this.showRecipients) {
      FooTable.get('#recpPref').pageSize(this.displaySize);
    }
    this.taxIdSelected = true;
    this.prevFlowInd = false;
    this.tempRevFlow = false;
    document.getElementById('recpContBtn').disabled = true;
    this.recpSelEachNpi = [];
    //this.npiRowArray.sort(); // This line as commented for flipping the npi rows in IE.
    // this.npiRowArray.sort();
    if ( this.showRecipients) {
      this.saveContent();
      this.di.$state.go('app.verifydelivery', {}, { location: false });
    } else {
      $('#optionsRadios1').prop('checked', true);
      let counter = 0;
      let isMultipleNPIPresent = false;
      for (let i = 0; i < this.npiRowArray.length; i++) {
        for (const j in this.npiRowArray[i]) {
          if (!isNaN(parseFloat(this.npiRowArray[i][j]))) {
            counter++;
          }
          if (counter === 2) {
            isMultipleNPIPresent = true;
            break;
          }
        }
      }
      if (isMultipleNPIPresent) {
        $('#continueModal').modal({backdrop: 'static', keyboard: true});
      } else {
        this.disableNpi = true;
        this.populateRecipients();
      }
    }
    this.multipleNpiFlag = 'Y';
  }
  populateRecipients(isPrevious, isAdditionalRecp) {
    if (isAdditionalRecp) {
      this.taxIdSelected = true;
      this.showRecipients = true;
      this.disableNpi = true;
      this.currentNpi = this.allNpi;
      this.additionFlow = true;
      document.getElementById('NotiTaxId').hidden = true;
      // document.getElementById('recpContBtn').disabled = true;
      this.getAdmin();
    } else {
      this.showRecipients = true;
      this.recpSelEachNpi = [];
      this.fillNpis();
      let npiHolder = {'allnpisData': []};
      const self = this;
      for (let a = 0; a < this.allNpi.length; a++) {
        npiHolder.allnpisData.push({'npi': this.allNpi[a], 'recpSelected': false});
      }
      this.recpSelEachNpi.push(npiHolder);
      /* eslint-enable */
      this.allNpi.sort();
      if (this.disableNpi === false) {
        this.currentNpi = this.allNpi[0];
      } else {
        this.currentNpi = this.allNpi;
      }
      if (isPrevious) {
        this.isPrevious = true;
        this.isFromPrevious = false;
        for (let i = 0; i < this.allData.length; i++) {
          for (let il = 0; il < this.allData[i].length; il++) {
            if (this.selectedUserId.indexOf(this.allData[i][il].value.uname) === -1) {
              this.allData[i][il].value.select = '';
            } else {
              this.allData[i][il].value.select = true;
            }
          }
        }
        this.prevFlowInd = true;
        this.populateRecep(this.allData[0]);
      } else {
        this.saveContent();
      }
    }
  }
  fillNpis() {
    this.allNpi = [this.npiRowArray[0].npi0, this.npiRowArray[0].npi1, this.npiRowArray[0].npi2, this.npiRowArray[0].npi3, this.npiRowArray[0].npi4];
    for ( let i = 1; i < this.npiRowArray.length; i++) {
      if (this.npiRowArray[i] !== null && this.npiRowArray[i] !== undefined) {
        const rows = [this.npiRowArray[i].npi0, this.npiRowArray[i].npi1, this.npiRowArray[i].npi2, this.npiRowArray[i].npi3, this.npiRowArray[i].npi4];
        this.allNpi = this.allNpi.concat(rows);
      }
    }
    /* eslint-disable */
    this.allNpi = this.allNpi.filter(function(v){ return v !== '' });
  }
  saveContent(element) {
    let prevData = null;
    this.displaySize = 10;
    this.allNpi.forEach(function(indNpi) {
      if (document.getElementById(indNpi) !== null && document.getElementById(indNpi) !== undefined) {
        document.getElementById(indNpi).style.color = '#337ab7';
        document.getElementById(indNpi).style.textDecoration = 'underline';
        document.getElementById('list_' + indNpi).style.borderLeftColor = 'white';
        document.getElementById('list_' + indNpi).style.backgroundColor = 'white';
      }
    });
    if (this.prevFlowInd === true) {
      // const prevValNpi = this.currentNpi;
      this.currentNpi = element;
      const currScope = this;
      if (this.disableNpi === false) {
        this.allNpi.forEach(function(indNpi) {
          if (document.getElementById(indNpi) !== null && document.getElementById(indNpi) !== undefined) {
            if (indNpi === currScope.currentNpi) {
              document.getElementById(indNpi).style.color = 'dimgrey';
              document.getElementById(indNpi).style.textDecoration = 'none';
            } else {
              document.getElementById(indNpi).style.color = '#337ab7';
              document.getElementById(indNpi).style.textDecoration = 'underline';
            }
          }
        });
      } else {
        this.allNpi.forEach(function(indNpi) {
          if (document.getElementById(indNpi) !== null && document.getElementById(indNpi) !== undefined) {
            document.getElementById(indNpi).style.color = '#337ab7';
            document.getElementById(indNpi).style.textDecoration = 'underline';
          }
        });
      }
      for (let y = 0; y < this.allData.length; y++) {
        const currNpiPosi = element.indexOf(this.allData[y].npi);
        let matchNotFound = false;
        if (currNpiPosi > -1) {
          this.populateRecep(this.allData[y]);
          matchNotFound = true;
          this.allData[y].prevFlow = false;
        }
        if (currNpiPosi === -1 && y === this.allData.length - 1 && !matchNotFound) {
          this.getAdmin();
        }
      }
    } else {
      /* eslint-disable */
      if (FooTable.get('#recpPref') !== null && FooTable.get('#recpPref') !== undefined) {
        if (this.disableNpi){
          this.allNpi.forEach(function (indNpi) {
            if (document.getElementById(indNpi) !== null && document.getElementById(indNpi) !== undefined) {
              document.getElementById(indNpi).style.color = '#337ab7';
              document.getElementById(indNpi).style.textDecoration = 'underline';
              document.getElementById('list_' + indNpi).style.borderLeftColor = 'white';
              document.getElementById('list_' + indNpi).style.backgroundColor = 'white';
            }
          });
        }
        prevData = FooTable.get('#recpPref').rows.all;
        const rowcnt = FooTable.get('#recpPref').rows.all.length;
        prevData.npi = this.currentNpi;
        prevData.npiVisited = false;
        const self = this;
        self.chekData.forEach(function (checkedRows) {
          if (self.disableNpi === false && prevData.npi === checkedRows.npi) {
            prevData[checkedRows.rcdNum].value.select = true;
          }
          if (self.disableNpi === true) {
            prevData[checkedRows.rcdNum].value.select = true;
          }
        });
        const prevNpi = this.currentNpi;
        if (element !== null && element !== undefined) {
          this.currentNpi = element;
        }
        if (this.disableNpi === false) {
          const listIdPrev = 'list_' + prevNpi;
          const listIdCur = 'list_' + this.currentNpi;
          if (document.getElementById(prevNpi) !== null && document.getElementById(prevNpi) !== undefined) {
            document.getElementById(prevNpi).style.color = '#337ab7';
            document.getElementById(prevNpi).style.textDecoration = 'underline';
            document.getElementById(listIdPrev).style.borderLeftColor = 'white';
            document.getElementById(listIdPrev).style.backgroundColor = 'white';
          }
          if (document.getElementById(this.currentNpi) !== null && document.getElementById(this.currentNpi) !== undefined) {
            document.getElementById(this.currentNpi).style.color = 'dimgray';
            document.getElementById(this.currentNpi).style.textDecoration = 'none';
            document.getElementById(this.currentNpi).style.borderLeftColor = 'white';
            document.getElementById(listIdCur).style.backgroundColor = 'rgba(211, 211, 211, 0.33)';
          }
        }
        for (let p = 0; p < this.allData.length; p++) {
          if (this.allData[p].npi === prevNpi) {
            this.allData.splice(p, 1);
            prevData.npiVisited = true;
          }
          if (this.allData[p] !== undefined && this.allData[p].npi === this.currentNpi) {
            prevData.npiVisited = true;
          }
          if (this.allData[p] !== undefined && this.allData[p].value !== undefined && this.allData[p].value.npi === this.currentNpi) {
            prevData.npiVisited = true;
          }
        }
        if (this.allData.length === 0) {
          prevData.npiVisited = true;
        }
        if (this.isPrevious) {
          this.allData = [];
          this.allData.push(prevData);
        } else {
          this.allData.push(prevData);
        }

        if (this.disableNpi === false) {
          if (rowcnt > 0 && this.currentNpi !== prevNpi) {
            FooTable.get('#recpPref').destroy();
          }
          if (this.currentNpi !== prevNpi) {
            if (this.allData.length > 1) {
              let allCondFailed = true;
              let matchFound = false;
              const existingRecp = [];
              this.allData.forEach(function(npiData) {
                if (self.currentNpi === npiData.npi && npiData.npiVisited === true) {
                  npiData.forEach(function(exisRecord) {
                    existingRecp.push(exisRecord.value);
                  });
                  matchFound = true;
                  if (self.prevFlowInd === true) {
                    allCondFailed = false;
                    const prevNpiPosi = npiData.indexOf(self.allData);
                    self.populateRecep(self.allData[prevNpiPosi]);
                    // console.log('@614');
                  } else {
                    allCondFailed = false;
                    self.populateRecep(existingRecp);
                    // console.log('@617');
                  }
                } else {
                  if (npiData.npiVisited === false && matchFound === false && npiData.npi === prevNpi) {
                    allCondFailed = false;
                    // console.log('@619');
                    npiData.npiVisited = true;
                    self.getAdmin();
                  }
                }
              });
              if (allCondFailed) {
                this.allData.forEach(function(data_) {
                  if (self.currentNpi === data_.npi) {
                    data_.npiVisited = true;
                  }
                });
                // console.log('allfailed');
                this.getAdmin();
              }
            } else {
              // console.log('@626');
              this.getAdmin();
            }
          } else {
            const self_ = this;
            angular.element(document.getElementById(self_.currentNpi)).ready(function() {
              if (document.getElementById(self_.currentNpi) !== null) {
                document.getElementById(self_.currentNpi).style.color = 'dimgray';
                document.getElementById(self_.currentNpi).style.textDecoration = 'none';
                document.getElementById('list_' + self_.currentNpi).style.borderLeftWidth = '5px';
                document.getElementById('list_' + self_.currentNpi).style.borderLeftStyle = 'solid';
                document.getElementById('list_' + self_.currentNpi).style.borderLeftColor = 'rgb(51, 122, 183)';
                document.getElementById('list_' + self_.currentNpi).style.backgroundColor = 'rgba(211, 211, 211, 0.33)';
              }
            });
          }
          /* eslint-enable */
        }
      } else {

        this.getAdmin();
      }
    }
  }

  getAdmin(){
    const parAdmin = {
      'organizationId': this.orgId,
      'roleId': this.roleIdAdmin
    };
    const paramsUserAdmin = {
      'organizationId': this.orgId,
      'roleId': this.roleIdUserAdmin
    };

    this.di.avUsersResource.query({params: parAdmin}).then(response => {
      // cache user
      this.recpAdmin = response.data.users;
      this.recpUserAdmin = this.getUserAdmin(paramsUserAdmin);
    });
  }

  getUserAdmin(paramsUserAdmin){
    const paramsUser = {
      'organizationId': this.orgId,
      'roleId': this.roleIdPat360
    };
    const parUserAdmin = paramsUserAdmin;
    this.di.avUsersResource.query({params: parUserAdmin}).then(response => {
      // cache user
      this.recpUserAdmin = response.data.users;
      this.recpUser = this.getUsers(paramsUser);
    });
  }

  getUsers(paramsUser){
    const parUser = paramsUser;
    this.recpErrors = null;
    let offsetValue = 0;
    let totalres = 0;

    this.di.avUsersResource.query({params: parUser}).then(response => {
      this.recpUser = response.data.users;
      if (this.recpUser.length === 0) {
        this.recpErrors = 'In order for Recipients to be displayed, they must have access to Patient360.  If your users need access to Member Clinical Alerts, please add Patient360 to their account under Maintain Users and then return to Preference Center to complete the setup.';
      }
      totalres = response.data.totalCount;
      const recurUserCalls = Math.ceil(totalres / 50);
      for (let q = 0; q < recurUserCalls; q++) {
        offsetValue = offsetValue + 50;
        const parUserTotal = {
          'organizationId': this.orgId,
          'roleId': this.roleIdPat360,
          'offset': offsetValue
        };
        /* eslint-disable */
        this.di.avUsersResource.query({params: parUserTotal}).then(res => {
          this.recpUser = this.recpUser.concat(res.data.users);
          if (q === (recurUserCalls -1 )) {
            this.getReceRole(this.recpAdmin, this.recpUserAdmin, this.recpUser);
            this.populateRecep(null);
          }
        });
        /* eslint-enable */
      }
    });
  }
  getReceRole(adminUser, userAdmin, user) {
    for (let l = 0; l < user.length; l++) {
      user[l].role = 'User';
      user[l].email = user[l].email || '';
      for (let m = 0; m < adminUser.length; m++) {
        if (user[l].userId === adminUser[m].userId) {
          user[l].role = 'Administrator';
          adminUser[m].role = 'Administrator';
        }
      }
      for (let n = 0; n < userAdmin.length; n++) {
        if ( (user[l].userId === userAdmin[n].userId) && (user[l].role !== 'Administrator') ) {
          user[l].role = 'User Admin';
          userAdmin[n].role = 'User Admin';
        }
      }
    }
    let sortedUsers = [];
    const sortedUsersAdmin = [];
    const sortedUsersUserAdmin = [];
    const sortedUsersUser = [];
    for (let s = 0; s < user.length; s++) {
      if (user[s].role === 'Administrator') {
        user[s].sortValue = '1';
        sortedUsersAdmin.push(user[s]);
      }
    }
    sortedUsersAdmin.sort(function(a, b){
      if (a.lastName < b.lastName) return -1;
      if (a.lastName > b.lastName) return 1;
      return 0;
    });
    for (let t = 0; t < user.length; t++) {
      if (user[t].role === 'User Admin') {
        user[t].sortValue = '2';
        sortedUsersUserAdmin.push(user[t]);
      }
    }
    sortedUsersUserAdmin.sort(function(a, b){
      if (a.lastName < b.lastName) return -1;
      if (a.lastName > b.lastName) return 1;
      return 0;
    });
    for (let u = 0; u < user.length; u++) {
      if (user[u].role === 'User') {
        user[u].sortValue = '3';
        sortedUsersUser.push(user[u]);
      }
    }
    sortedUsersUser.sort(function(a, b){
      if (a.lastName < b.lastName) return -1;
      if (a.lastName > b.lastName) return 1;
      return 0;
    });
    sortedUsers = sortedUsersAdmin;
    for (let v = 0; v < sortedUsersUserAdmin.length; v++) {
      sortedUsers.push(sortedUsersUserAdmin[v]);
    }
    for (let w = 0; w < sortedUsersUser.length; w++) {
      sortedUsers.push(sortedUsersUser[w]);
    }

    this.recpAdmin = adminUser;
    this.recpUserAdmin = userAdmin;
    this.recpUser = sortedUsers;
  }
  populateRecep(existingData){
    let recepients = {};
    this.taxIdSelected = true;
    let prevFlowExec = 0;
    this.allNpi = this.allNpi.sort();
    if (this.prevFlowInd === true && prevFlowExec === 0) {
      this.currentNpi = this.allNpi[0];
      prevFlowExec++;
    }
    if (this.disableNpi === false ) {
      const self_ = this;
      angular.element(document.getElementById(self_.currentNpi)).ready(function() {
        if (document.getElementById(self_.currentNpi) !== null) {
          document.getElementById(self_.currentNpi).style.color = 'dimgray';
          document.getElementById(self_.currentNpi).style.textDecoration = 'none';
          document.getElementById('list_' + self_.currentNpi).style.borderLeftWidth = '5px';
          document.getElementById('list_' + self_.currentNpi).style.borderLeftStyle = 'solid';
          document.getElementById('list_' + self_.currentNpi).style.borderLeftColor = 'rgb(51, 122, 183)';
          document.getElementById('list_' + self_.currentNpi).style.backgroundColor = 'rgba(211, 211, 211, 0.33)';
        }
      });
    }
    if (existingData === null) {
      let condThree = null;
      if (this.recpUser !== null) {
        condThree = this.recpUser;
      }
      recepients = condThree;
    } else {
      recepients = existingData;
    }
    const $j = jQuery.noConflict();
    let exisRow = [];
    const rowCount = recepients.length;
    const levelOne = [];
    let i = 0;
    const self = this;
    let recpName = null;
    let recpUsername = null;
    for (i = 0; i < rowCount; i++) {
      const rowData = {};
      const cb = document.createElement('input');
      if (this.prevFlowInd === true && recepients[i].value !== null && recepients[i].value !== undefined) {
        recpName = recepients[i].value.name;
        recpUsername = recepients[i].value.uname;
        rowData.email = recepients[i].value.email;
        rowData.akaname = recepients[i].value.akaname;
        rowData.role = {
          'options': {
            'sortValue': recepients[i].value.sortValue
          },
          'value': recepients[i].value.role
        };
      }
      if (recepients[i].value === null || recepients[i].value === undefined) {
        if (recepients[i].name === null || recepients[i].name === undefined) {
          recpName = recepients[i].lastName + ', ' + recepients[i].firstName;
        } else {
          recpName = recepients[i].name;
        }
        // recpUsername = recepients[i].uname;
        if (recepients[i].uname === null || recepients[i].uname === undefined) {
          recpUsername = recepients[i].userId;
        } else {
          recpUsername = recepients[i].uname;
        }
        rowData.email = recepients[i].email || '';
        rowData.akaname = recepients[i].akaname;
        rowData.role = {
          'options': {
            'sortValue': recepients[i].sortValue
          },
          'value': recepients[i].role
        };
      }
      cb.type = 'checkbox';
      cb.autocomplete = 'on';
      cb.id = 'chb' + i;
      cb.value = i;
      // cb.style.backgroundColor = 'lightgrey';
      if (recepients[i].select) {
        cb.checked = true;
      }
      if (this.prevFlowInd === true && recepients[i].value !== null && recepients[i].value !== undefined) {
        if (recepients[i].value.select) {
          if (this.currentNpi === recepients.npi) {
            cb.checked = true;
          }
        }
      }
      if (this.prevFlowInd === false && (recepients[i].email === null || recepients[i].email === undefined || recepients[i].email === '')) {
        cb.disabled = true;
      }
      if (this.prevFlowInd === true && recepients[i].value !== null && recepients[i].value !== undefined) {
        if (recepients[i].value.email === null || recepients[i].value.email === undefined || recepients[i].value.email === '') {
          cb.disabled = true;
        } else {
          cb.disabled = false;
        }
      }
      if (this.isPrevious && recepients[i].value && this.allData.length === 1) {
        if (recepients[i].value.select) {
          cb.checked = true;
        }
        if (recepients[i].value.email === null || recepients[i].value.email === undefined || recepients[i].value.email === '') {
          cb.disabled = true;
        } else {
          cb.disabled = false;
        }
      }
      if (this.additionFlow === true) {
        for (let y = 0; y < this.addFlowExisRecp.length; y++) {
          if (this.addFlowExisRecp[y].userid === recepients[i].userId) {
            cb.checked = true;
            cb.disabled = true;
          }
        }
      }

      /* eslint-disable */
      cb.onclick = function(e){
        e.stopPropagation();
        self.iniiValue ++;
        self.assignSortValueIni();
        let currChkData = {};
        let rcdNum = null;
        if (e.srcElement !== undefined && e.srcElement !== null) {
          rcdNum = e.srcElement.value;
        } else {
          rcdNum = e.target.value;
        }
        const rwData = FooTable.get('#recpPref').rows.all[rcdNum].value;
        const chkbxId = 'chb' + rcdNum;
        currChkData = {'npi': self.currentNpi, 'rcdNum': rcdNum, 'rowData': rwData };
        if (document.getElementById(chkbxId).checked === true) {
          // document.getElementById(chkbxId).options.sortValue = '1';
          FooTable.get('#recpPref').rows.all[rcdNum].cells[0].sortValue = '1';
          self.saveCheckdata(currChkData, true);
        } else {
          // document.getElementById(chkbxId).options.sortValue = '2';
          FooTable.get('#recpPref').rows.all[rcdNum].cells[0].sortValue = '2';
          self.saveCheckdata(currChkData, false);
        }
      };
      /* eslint-enable */
      rowData.name = recpName;
      rowData.uname = recpUsername;
      rowData.select = cb;
      levelOne.push(rowData);
    }
    exisRow = {'levelone': levelOne};
    $j(function($s){
      $s('#recpPref').footable({
        'columns': recipCol,
        'rows': exisRow.levelone,
        'paging': {
          'enabled': true
        },
        'sorting': {
          'enabled': true
        }
      });
    });
    /* eslint-disable */
    this.di.$interval(function() {
      if (!FooTable.get('#recpPref')) return;
      //self.isRecpSelected = self.chekData.length;
      let MAX_RECEPIENTS = 20;
      if (self.carePlanNotif === true) {
        MAX_RECEPIENTS = self.maxRecpAllwd;
      }
      let npiCountReached = false;
      const existingCount = self.di.dashboard.selectedAddRecp ? self.di.dashboard.selectedAddRecp.length : 0;

      if (self.disableNpi) {
        npiCountReached = (self.chekData.length + existingCount) >= MAX_RECEPIENTS;
      } else {
        if (self.chekData.length) {
          let npiCount = 0;
          self.chekData.forEach(function(ele) {
            npiCount = (ele.npi === self.currentNpi) ? (npiCount + 1) : npiCount;
          });

          npiCountReached = (npiCount + existingCount) >= MAX_RECEPIENTS;
        }
      }

      if ( npiCountReached ) {
        //self.isRecpSelected = self.chekData.length;
        let idx = 0;

        while (idx < FooTable.get('#recpPref').rows.all.length) {
          const checkBox = document.getElementById('chb' + idx);

          if (checkBox) checkBox.disabled = checkBox.checked ? checkBox.disabled : true;
          idx++;
        }
        self.insideInterval = true;
      } else {
        let idx = 0;

        while (idx < FooTable.get('#recpPref').rows.all.length) {
          const checkBox = document.getElementById('chb' + idx);

          if (FooTable.get('#recpPref').rows.all[idx].value.email.length) {
            if (checkBox) checkBox.disabled = checkBox.checked ? checkBox.disabled : false;
          }
          idx++;
        }
      }
    }, 500);
    this.di.$timeout(function() {
      $('a.footable-page-link').attr('href', 'javascript:void(0)');
    }, 3000);
  }
  assignSortValueIni(){
    if (this.iniiValue === 1) {
      const rwcnt = FooTable.get('#recpPref').rows.all.length;
      for (let y = 0; y < rwcnt; y++) {
        FooTable.get('#recpPref').rows.all[y].cells[0].sortValue = '2';
      }
    }
    /* eslint-enable */
  }
  saveCheckdata(chekData, isCheck){
    const parscvope = this.self;
    if (isCheck) {
      parscvope.chekData.push(chekData);
      if (this.disableNpi === true) {
        this.recpSelected = this.recpSelected + 1;
      } else {
        for (let u = 0; u < this.recpSelEachNpi[0].allnpisData.length; u++) {
          if (this.currentNpi === this.recpSelEachNpi[0].allnpisData[u].npi) {
            this.recpSelEachNpi[0].allnpisData[u].recpSelected = true;
          }
        }
      }
      this.selectedUserId.push(chekData.rowData.uname);
    } else {
      this.selectedUserId.splice(this.selectedUserId.indexOf(chekData.rowData.uname), 1);
      if (this.disableNpi === true) {
        let recDeleted = false;
        let delRcNum = 0;
        // let delRcNumInt = 0;
        for (let r = 0; r < parscvope.chekData.length; r++) {
          if (parscvope.chekData[r] !== null && parscvope.chekData[r] !== undefined && recDeleted === false) {
            for (let v = 0; v < parscvope.chekData[r].npi.length; v++) {
              if (parscvope.chekData[r].npi[v] === chekData.npi[r] && parscvope.chekData[r].rcdNum === chekData.rcdNum) {
                parscvope.chekData[r].rowData.select = false;
                delRcNum = r;
                // delRcNumInt = v;
                recDeleted = true;
              }
            }
          }
        }
        // parscvope.chekData[delRcNum].splice(delRcNumInt, 1);
        parscvope.chekData.splice(delRcNum, 1);
      } else {
        for (let r = 0; r < parscvope.chekData.length; r++) {
          if (parscvope.chekData[r].npi === chekData.npi && parscvope.chekData[r].rcdNum === chekData.rcdNum) {
            parscvope.chekData.splice(r, 1);
          }
        }
      }
      
      for (let i = 0; i < parscvope.chekData.length; i++) {
        if (parscvope.chekData[i].rowData.uname === chekData.rowData.uname
          && parscvope.chekData[i].npi === chekData.npi && parscvope.chekData[i].rcdNum === chekData.rcdNum) {
          parscvope.chekData[i].rowData.select = chekData.rowData.select;
        }
      }
     
      if (this.disableNpi === true) {
        this.recpSelected = this.recpSelected - 1;
      } else {
        for (let u = 0; u < this.recpSelEachNpi[0].allnpisData.length; u++) {
          if (this.currentNpi === this.recpSelEachNpi[0].allnpisData[u].npi) {
            this.recpSelEachNpi[0].allnpisData[u].recpSelected = false;
          }
        }
      }
    }
    if (this.disableNpi === true) {
      if (this.recpSelected > 0) {
        this.isRecpSelected = true;
        document.getElementById('recpContBtn').disabled = false;
      } else {
        this.isRecpSelected = false;
        document.getElementById('recpContBtn').disabled = true;
      }
    } else {
      document.getElementById('recpContBtn').disabled = false;
      let validNpiCount = 0;
  
      this.allNpi.forEach(function (npi) {
        let found = false;
        parscvope.chekData.forEach(function (chkData) {
          if(npi === chkData.npi) found = true;
        });
        
        if (found) validNpiCount++
      });
      console.log('Valid count ' + validNpiCount);
      document.getElementById('recpContBtn').disabled = validNpiCount != this.allNpi.length;
      /*for (let t = 0; t < this.recpSelEachNpi[0].allnpisData.length; t++) {
        if (this.recpSelEachNpi[0].allnpisData[t].recpSelected === false ) {
          document.getElementById('recpContBtn').disabled = true;
        }
      }*/
    }
    if (this.isPrevious) {
      if (this.selectedUserId && this.selectedUserId.length) {
        this.isFromPrevious = false;
      } else {
        this.isFromPrevious = true;
        document.getElementById('recpContBtn').disabled = true;
      }
    }
  }
  cancel(){
    this.taxIdSelected = false;
    $('#continueModal').modal('hide');
  }

  continue(){
    window.scrollTo(0, 0);
    $('#continueModal').modal('hide');
    if (document.getElementById('optionsRadios1').checked === true) {
      this.disableNpi = true;
    } else {
      this.disableNpi = false;
    }
    this.populateRecipients();
    if (FooTable.get('#recpPref')) {
      this.chekData = [];
      this.allData = [];
      this.selectedUserId = [];
      FooTable.get('#recpPref').gotoPage(1);
      $("[id^='chb']").prop('checked', false);
      this.di.$timeout(function() {
        $("[id^='chb']").prop('checked', false);
      }, 500);
    }
    this.isRecpSelected = false;
    document.getElementById('recpContBtn').disabled = true;
  }

  toggleNPIError(id) {
    const errorString = id.innerHTML;
    if (errorString === 'Invalid NPI') {
      id.innerHTML = 'Enter a valid NPI containing 10 numeric digits and beginning with a 1, 2, 3, or 4';
      return;
    }
    if (errorString === 'Enter a valid NPI containing 10 numeric digits and beginning with a 1, 2, 3, or 4') {
      id.innerHTML = 'Invalid NPI';
      return;
    }
  }
  showDetailNPIError(errorText, index){

    const errorId = '#' + errorText + index;
    const existingErrorText = 'Invalid NPI';
    if ($(errorId).text() === existingErrorText) {
      $(errorId).text('Enter a valid NPI containing 10 numeric digits and beginning with a 1, 2, 3, or 4');
    }

  }

  showInvalidNPI(errorText, index){
    const errorId = '#' + errorText + index;
    const existingErrorText = 'Enter a valid NPI containing 10 numeric digits and beginning with a 1, 2, 3, or 4';
    if ($(errorId).text() === existingErrorText) {
      $(errorId).text('Invalid NPI');
    }

  }
  openExistingPrefDialog(){
    this.isExistingPrefTaxId = false;
    if (this.existingPrefTaxIdArray.length > 0) {
      for (let i = 0; i < this.existingPrefTaxIdArray.length && !this.isExistingPref; i++) {
        if (this.existingPrefTaxIdArray[i] === this.taxId.number) {
          this.isExistingPrefTaxId = true;
        }
      }
    }
    if (this.isExistingPrefTaxId){
      $('#existingPrefTaxIdModal').modal({backdrop: 'static', keyboard: true});
    }
  }
  cancelExistingPrefTaxIdDialog(){
    this.taxId = null;
    $('#existingPrefTaxIdModal').modal('hide');
    this.isExistingPreferences = 'yes';
  }
  continueExistingPrefTaxIdDialog(){
    if (this.isExistingPreferences === 'yes') {
      this.taxIdSelected = false;
      this.isExistingPreferences = 'yes';
      $('.body').removeClass('modal-open');
      $('.modal-backdrop').remove();
      this.di.$state.go('app.dashboard', {taskTodo: 'continue' }, { location: false });
    } else {
      this.taxId = null;
      $('#existingPrefTaxIdModal').modal('hide');
      this.isExistingPreferences = 'yes';
    }
  }
  openTaxidDialog(latestTaxId){
    let counter = 0;
    // if(latestTaxId && latestTaxId !== this.oldTaxId)

    for (let i = 0; i < this.npiRowArray.length; i++) {
      for (const j in this.npiRowArray[i]) {
        if (j !== 'isTopButton' && j !== '$$hashKey' && this.npiRowArray[i][j] !== '') {
          counter++;
        }
        /* if (!isNaN(parseFloat(this.npiRowArray[i][j]))) {
          counter++;
        } */
      }
    }
    // initialize old taxId first time

    if (latestTaxId && !this.oldTaxId) {
      this.oldTaxId = latestTaxId;
    }
    if (counter && latestTaxId && this.oldTaxId && latestTaxId !== this.oldTaxId){
      $('#taxIdModal').modal({backdrop: 'static', keyboard: true});
    }

  }

  // method to call cancel modal on click cancel button in Providers&Recipients page
  openCancelDialog() {
    $('#statusModal').modal({backdrop: 'static', keyboard: true});
  }

  cancelTaxidDialog(){
    this.taxId = this.oldTaxId;
    $('#taxIdModal').modal('hide');
    this.isYes = 'yes';
  }

  continueTaxidDialog(isYes){
    if (isYes === 'yes') {
      this.npiRowArray = [{'npi0': '', 'npi1': '', 'npi2': '', 'npi3': '', 'npi4': '', 'isTopButton': true}];
      $('#taxIdModal').modal('hide');
      this.isYes = 'yes';
      this.oldTaxId = this.taxId;
      document.getElementById('npiContBtn').disabled = true;
      this.isFirstNpiRowFilled = false;
    } else {
      this.taxId = this.oldTaxId;
      $('#taxIdModal').modal('hide');
      this.isYes = 'yes';
    }
  }
  getResultsByPageSize(){
    const newPageSize = this.displaySize;
    /* eslint-disable */
    FooTable.get('#recpPref').pageSize(newPageSize);
    /* eslint-enable */
  }
  mySortValue(valueOrElement){
    /* eslint-disable */
    if (FooTable.is.element(valueOrElement) || FooTable.is.jq(valueOrElement)) return jQuery(valueOrElement).data('sortValue') || this.parser(valueOrElement);
    if (FooTable.is.hash(valueOrElement) && FooTable.is.hash(valueOrElement.options)){
      if (FooTable.is.string(valueOrElement.options.sortValue)) return valueOrElement.options.sortValue;
      if (FooTable.is.defined(valueOrElement.value)) valueOrElement = valueOrElement.value;
    }
    if (FooTable.is.defined(valueOrElement) && valueOrElement != null) return valueOrElement;
    return null;
    /* eslint-enable */
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  updateTaxIdAddFlow(taxIdDel) {
    /* eslint-disable */
    angular.element(document).ready(function () {
      const addTaxId = document.getElementById('addFlowTaxId');
      // $("#addFlowTaxId").val(taxIdDel);
      /* for (let i = 0; i < addTaxId.options.length; i++) {
        if (addTaxId.options[i].text === taxIdDel) {
          addTaxId.options[i].selected = true;
        }
      } */
      document.getElementById('addFlowTaxId').value = taxIdDel;
    });
    /* eslint-enable */
  }
}

app
  .addModules([
    availity,
    uiRouter
  ])
  .service('setpreference', SetPreference);

export default app;
