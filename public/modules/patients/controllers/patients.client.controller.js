'use strict';


// Patients controller
angular.module('patients').controller('PatientsController', ['$scope', '$stateParams', '$location', 'Patients', 'CoreProperties', 'Logger', 'lodash', 'moment', '$modal', 'Upload', 'ActionsHandler', 'Toolbar', 'validationManager',
    function ($scope, $stateParams, $location, Patients, CoreProperties, Logger, lodash, Moment, $modal, Upload, ActionsHandler, Toolbar, validationManager) {


        $scope.configObj = {};
        $scope.configObj._ = lodash;
        $scope.configObj.Moment = Moment;
        $scope.configObj.genders = [
            {_id: 'male', name: 'Male'},
            {_id: 'female', name: 'Female'}
        ];
        $scope.configObj.photo = null;
        $scope.configObj.age = null;
        $scope.configObj.patient_genders = [];
        $scope.configObj.maxDate = new Moment();
        $scope.configObj.minDate = new Moment().subtract(150, 'years');
        $scope.configObj.dateOptions = {
            formatYear: 'yyyy',
            startingDay: 6
        };
        $scope.configObj.format = 'yyyy/MM/dd';
        $scope.configObj.opened = false;
        $scope.configObj.photoCss = null;
        $scope.configObj.personalPhotoPath = null;

        //region Date functions
        $scope.today = function () {
            $scope.patient.birthDate = new Moment();
        };

        $scope.clear = function () {
            $scope.patient.birthDate = null;
        };

        $scope.openDatePicker = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.configObj.opened = true;
        };

        $scope.ageChanged = function (newAge) {
            $scope.patient.birthDate = new Moment().subtract(newAge, 'years').format('YYYY/MM/DD');
        };

        $scope.birthDateChanged = function (birthDate) {
            $scope.configObj.age = new Moment().diff(new Moment(birthDate), 'years');
        };


//endregion Date Functions

        //region Helper functions

        lodash.mixin({
            'findByValues': function (collection, property, values) {
                return lodash.filter(collection, function (item) {
                    return lodash.contains(values, item[property]);
                });
            }
        });

        lodash.mixin({
            'findByValuesInPath': function (collection, property, values, path) {
                return lodash.filter(collection, function (item) {
                    return lodash.contains(lodash.map(values, path), item[property]);
                });
            }
        });

        //endregion Helper functions

        //region Photo

        $scope.openModal = function (size) {
            var modalInstance = $modal.open({
                templateUrl: 'myModalContent.html',
                controller: 'ModalInstanceCtrl',
                size: size,
                resolve: {
                    items: function () {
                        return $scope.items;
                    }
                }
            });
            modalInstance.result.then(function (finalPhoto) {
                $scope.configObj.photo = finalPhoto;
                $scope.configObj.photoCss = "{'background-image': 'url('+$scope.configObj.photo+')'}";
            }, function () {
                //$log.info('Modal dismissed at: ' + new Date());
            });
        };

        //endregion Photo


        //select Gender
        $scope.toggleGenderSelection = function (gender_id) {
            $scope.patient.gender = gender_id;
        };

        var dataURItoBlob = function (dataURI) {
            var binary = atob(dataURI.split(',')[1]);
            var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
            var array = [];
            for (var i = 0; i < binary.length; i++) {
                array.push(binary.charCodeAt(i));
            }
            return new Blob([new Uint8Array(array)], {type: mimeString});
        };

        // Create new Patient
        $scope.create = function () {
            validationManager.validateForm(angular.element(document.querySelector('#patientForm')));
            if (!$scope.patientForm.$valid) {
                return;
            }
            // Create new Patient object
            var patient = angular.fromJson(angular.toJson($scope.patient));
            if ($scope.configObj.photo) {
                lodash.extend(patient, {personalPhoto: true});
            }
            var blob = ($scope.configObj.photo) ? dataURItoBlob($scope.configObj.photo) : null;
            Upload.upload({
                url: '/patients',
                method: 'POST',
                headers: {'Content-Type': 'multipart/form-data'},
                //withCredentials: true,
                data: patient,
                file: blob
            }).success(function (response, status) {
                    $location.path('patients/' + response._id);

                    if (response.warn) {
                        Logger.warn(response.error.message, true);
                    }
                    else {
                        ///log success message
                        Logger.success('Patient created successfully', true);
                    }
                    // Clear form fields
                    $scope.initOne();
                }
            ).error(function (err) {
                    Logger.error(err.message, true);
                    //$scope.error = errorResponse.data.message;
                }
            );
        };

        // Remove existing Patient
        $scope.remove = function (patient) {
            if (patient) {
                patient.$remove(function () {
                    for (var i in $scope.patients) {
                        if ($scope.patients [i] === patient) {
                            $scope.patients.splice(i, 1);
                        }
                    }
                    ///log success message
                    Logger.success('Patient deleted successfully', true);
                }, function (errorResponse) {
                    ///log error message
                    Logger.error(errorResponse.data.message, true);
                });

            } else {
                $scope.patient.$remove(function () {
                    $location.path('patients');
                    ///log success message
                    Logger.success('Patient deleted successfully', true);
                }, function (errorResponse) {
                    ///log error message
                    Logger.error(errorResponse.data.message, true);
                });
            }
        };
        //redirect to examination
        $scope.examine = function () {
            $location.path('examinations/create/' + $scope.patient._id);
        };

        //redirect to new visit
        $scope.newVisit = function () {
            $location.path('visits/create/' + $scope.patient._id);
        };

        // Update existing Patient
        $scope.update = function () {
            validationManager.validateForm(angular.element(document.querySelector('#patientForm')));
            if (!$scope.patientForm.$valid) {
                return;
            }
            var patient = angular.fromJson(angular.toJson($scope.patient));
            if ($scope.configObj.photo) {
                lodash.extend(patient, {personalPhoto: true});
            }
            var blob = ($scope.configObj.photo) ? dataURItoBlob($scope.configObj.photo) : null;
            Upload.upload({
                url: '/patients/' + patient._id, //upload.php script, node.js route, or servlet url
                method: 'PUT',
                headers: {'Content-Type': 'multipart/form-data'},
                //withCredentials: true,
                data: patient,
                file: blob
            }).success(function (response, status) {
                    $location.path('patients/' + response._id);
                    if (response.warn) {
                        Logger.warn(response.error.message, true);
                    }
                    else {
                        ///log success message
                        Logger.success('Patient updated successfully', true);
                    }
                    // Clear form fields
                    $scope.initOne();
                }
            ).error(function (err) {
                    Logger.error(err.message, true);
                    //$scope.error = errorResponse.data.message;
                }
            );

        };


        // Find existing Patient
        $scope.findOne = function (callback) {
            Patients.get({
                patientId: $stateParams.patientId
            }, function (patient) {
                $scope.patient = patient;
                CoreProperties.setPageSubTitle(patient.fullName);
                $scope.configObj.age = new Moment().diff(new Moment($scope.patient.birthDate, 'YYYY/MM/DD'), 'years');
                if ($scope.patient.personalPhoto) {
                    $scope.configObj.personalPhotoPath = 'patients/personal-photo/' + $scope.patient._id;
                }

                if (callback) {
                    callback();
                }
            });
        };

        // Search existing patients
        $scope.search = function (callback) {
            var paginationConfig = {};
            paginationConfig.pageNo = $scope.paginationConfig.currentPage;
            paginationConfig.pageSize = $scope.paginationConfig.pageSize;

            if($scope.patient && $scope.patient.hasOwnProperty('gender')){
                $scope.patient.gender=$scope.patient.gender._id;
            }
            if($scope.configObj && $scope.configObj.hasOwnProperty('age') && !lodash.isEmpty($scope.configObj.age) && $scope.configObj.age.hasOwnProperty('Range') && !lodash.isEmpty($scope.configObj.age.Range) && ($scope.configObj.age.Range.from || $scope.configObj.age.Range.to)){
                $scope.patient.birthDate={};
                $scope.patient.birthDate.__range='';
                if($scope.configObj.age.Range.hasOwnProperty('to') && $scope.configObj.age.Range.to){
                    $scope.patient.birthDate.__range+= new Moment().subtract($scope.configObj.age.Range.to, 'years').format('YYYY/MM/DD');
                }
                $scope.patient.birthDate.__range+=':';
                if($scope.configObj.age.Range.hasOwnProperty('from') && $scope.configObj.age.Range.from){
                    $scope.patient.birthDate.__range+= new Moment().subtract($scope.configObj.age.Range.from, 'years').format('YYYY/MM/DD');
                }
                //console.log( $scope.patient.birthDate.__range);
            }

            if ($scope.patient && !lodash.isEmpty($scope.patient)) {
                $location.search({searchObj: JSON.stringify($scope.patient), paginationObj: JSON.stringify(paginationConfig)});
                //$location.replace();
            }
            Patients.query({searchObj: $scope.patient, paginationObj: paginationConfig}, function (_res) {
                $scope.patients = _res.list;
                if (callback) {
                    callback(_res.count);
                }
            });
        };

        // Find existing Patient
        $scope.initOne = function () {
            $scope.patient = new Patients({});
        };

        $scope.initCreate = function () {
            $scope.initOne();
            Toolbar.addToolbarCommand('savePatient', 'create_patient', 'Save', 'floppy-save', 0);
        };
        $scope.initEdit = function () {
            $scope.findOne(function () {
                Toolbar.addToolbarCommand('updatePatient', 'edit_patient', 'Save', 'floppy-save', 0);
            });
        };
        $scope.initView = function () {
            $scope.findOne(function () {
                Toolbar.addToolbarCommand('newVisit', 'create_visit', 'New Visit', 'log-in', 0)
                Toolbar.addToolbarCommand('examinePatient', 'create_examination', 'Examine', 'eye-open', 0);
                Toolbar.addToolbarCommand('patientExaminations', 'list_examinations', 'List', 'list', 1);
                Toolbar.addToolbarCommand('editPatient', 'edit_patient', 'Edit', 'edit', 2);
                Toolbar.addToolbarCommand('deletePatient', 'delete_patient', 'Delete', 'trash', 3, null, 'Are you sure to delete patient "' + $scope.patient.fullName + '"?');
            });
        };

        $scope.initSearch = function () {
            $scope.initOne();
            $scope.initPagination();
            Toolbar.addToolbarCommand('searchPatient', 'list_patients', 'Search', 'search', 0);
            var searchQuery = $location.search();
            if (searchQuery && !lodash.isEmpty(searchQuery)) {
                $scope.patient = JSON.parse(searchQuery.searchObj);
                var pagingConf = JSON.parse(searchQuery.paginationObj);
                $scope.paginationConfig.currentPage = pagingConf.pageNo;
                $scope.paginationConfig.pageSize = pagingConf.pageSize;
                $scope.fireSearch();
            }
        };

        $scope.initList = function () {
            $scope.initOne();
            $scope.initPagination();
            $scope.fireSearch();
        };

        $scope.initPagination = function () {
            $scope.tabsConfig = {};
            $scope.tabsConfig.showResuls = false;
            $scope.paginationConfig = {};
            $scope.paginationConfig.pageSize = 10;
            $scope.paginationConfig.currentPage = 1;
            $scope.paginationConfig.totalItems = Number.MAX_VALUE;
            $scope.paginationConfig.maxSize = 2;
            $scope.paginationConfig.numPages = 1;
            $scope.paginationConfig.pageSizeOptions = [10, 50, 100];
            $scope.paginationConfig.showPagination = false;
        };

        $scope.getShowPagination = function () {
            //console.log($scope.paginationConfig.totalItems);
            return $scope.paginationConfig.totalItems > 0;
        };

        $scope.pageChanged = function () {
            //console.log($scope.paginationConfig.currentPage);
            //console.log('page changed');
            $scope.fireSearch();
        };

        $scope.getNumOfPages = function () {
            return  $scope.paginationConfig.totalItems / $scope.paginationConfig.maxSize;
        };

        $scope.selectPageSizeOption = function (_option) {
            if ($scope.isPageSizeOptionEnabled(_option)) {
                $scope.paginationConfig.pageSize = _option;
                $scope.fireSearch();
            }
        };
        $scope.isPageSizeOptionEnabled = function (_option) {
            var optionIndex = $scope.paginationConfig.pageSizeOptions.indexOf(_option);
            if (optionIndex == 0) {
                return true;
            }
            return $scope.paginationConfig.pageSizeOptions[optionIndex - 1] < $scope.paginationConfig.totalItems;
        };

        $scope.isPageSizeOptionSelecetd = function (_option) {
            return  $scope.paginationConfig.pageSize == _option;
        };

        ActionsHandler.onActionFired('savePatient', $scope, function (action, args) {
            $scope.create();
        });
        ActionsHandler.onActionFired('updatePatient', $scope, function (action, args) {
            $scope.update();
        });
        ActionsHandler.onActionFired('newVisit', $scope, function (action, args) {
            $scope.newVisit();
        });
        ActionsHandler.onActionFired('examinePatient', $scope, function (action, args) {
            $scope.examine();
        });
        ActionsHandler.onActionFired('patientExaminations', $scope, function (action, args) {
            $location.path('examinations/patient/' + $scope.patient._id);
        });
        ActionsHandler.onActionFired('editPatient', $scope, function (action, args) {
            $location.path('patients/' + $scope.patient._id + '/edit');
        });
        ActionsHandler.onActionFired('deletePatient', $scope, function (action, args) {
            $scope.remove();
        });

        ActionsHandler.onActionFired('searchPatient', $scope, function (action, args) {
            $scope.initPagination();
            $scope.fireSearch();
        });

        $scope.fireSearch = function () {
            $scope.search(function (_count) {
                $scope.tabsConfig.showResults = true;
                $scope.paginationConfig.totalItems = _count;
                $scope.paginationConfig.showPagination = $scope.getShowPagination();
                $scope.paginationConfig.numPages = $scope.getNumOfPages();
            });
        };
    }

]);

angular.module('patients').controller('ModalInstanceCtrl', function ($scope, $modalInstance, items, Logger) {
    $scope.modalConfig = {};
    $scope.modalConfig.tabs = [
        { active: true, disabled: false },
        { active: false, disabled: false },
        { active: false, disabled: true }
    ];
    $scope.modalConfig.photoWidth = null;
    $scope.modalConfig.photoHeight = null;
    $scope.modalConfig.finalPhoto = null;
    $scope.modalConfig.photos = [];
    $scope.modalConfig.selectedPhoto = null;
    $scope.modalConfig.inputImage = null;
    $scope.modalConfig.webcamError = false;

    var _video = null;
    $scope.onSuccess = function () {
        _video = $scope.myChannel.video;
    };
    $scope.myChannel = {
        // the fields below are all optional
        videoHeight: '240',
        videoWidth: '320',
        video: null // Will reference the video element on success
    };
    var getVideoData = function getVideoData() {
        var hiddenCanvas = document.createElement('canvas');
        hiddenCanvas.width = _video.width;
        hiddenCanvas.height = _video.height;
        var ctx = hiddenCanvas.getContext('2d');
        ctx.drawImage(_video, 0, 0, _video.width, _video.height);
        $scope.modalConfig.photoWidth = document.defaultView.getComputedStyle(_video, "").getPropertyValue("width");
        $scope.modalConfig.photoHeight = document.defaultView.getComputedStyle(_video, "").getPropertyValue("height");
        return hiddenCanvas.toDataURL();
    };
    $scope.makeSnapshot = function makeSnapshot() {
        if (_video) {
            var idata = getVideoData();
            $scope.selectPhoto(idata);
            //$scope.modalConfig.photos.push({src: idata})
        }
    };

    var img = new Image();
    img.onload = function () {
        var width = this.width;
        var height = this.height;
        var src = this.src;
    };

    $scope.inputPhoto = function (files) {
        var file = files[0];
        var reader = new FileReader();
        reader.onload = function (evt) {
            $scope.$apply(function ($scope) {
                $scope.modalConfig.inputImage = evt.target.result;
                img.src = evt.target.result;
            });
        };
        reader.readAsDataURL(file);

    };

    $scope.selectFile = function (file) {
        var reader = new FileReader();

        reader.onload = function (event) {
            $scope.$apply(function ($scope) {
                $scope.selectPhoto(event.target.result);
            });
        };
        // when the file is read it triggers the onload event above.
        reader.readAsDataURL(file);

    };


    $scope.selectInputPhoto = function () {
        $scope.modalConfig.photoWidth = img.width;
        $scope.modalConfig.photoHeight = img.height;
        $scope.modalConfig.tabs[2].disabled = false;
    };

    $scope.selectPhoto = function (photo) {
        $scope.modalConfig.selectedPhoto = photo;
        $scope.modalConfig.tabs[2].disabled = false;
        $scope.modalConfig.tabs[2].active = true;

    };

    $scope.onCamError = function (err) {
        $scope.$apply(function () {
            $scope.modalConfig.webcamError = err;
        });
    };

    $scope.photoCropped = function ($dataURI) {
        $scope.modalConfig.finalPhoto = $dataURI;
    };

    $scope.ok = function () {
        $modalInstance.close($scope.modalConfig.finalPhoto);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

});

angular.module('patients').directive('backImg', function () {
    return function (scope, element, attrs) {
        attrs.$observe('backImg', function (value) {
            element.css({
                'background-image': 'url(' + value + ')'
            });
        });
    };
});

angular.module('patients').directive('widthCss', function () {
    return function (scope, element, attrs) {
        attrs.$observe('widthCss', function (value) {
            element.css({
                'width': value
            });
        });
    };
});

angular.module('patients').directive('heightCss', function () {
    return function (scope, element, attrs) {
        attrs.$observe('heightCss', function (value) {
            element.css({
                'height': value
            });
        });
    };
});
