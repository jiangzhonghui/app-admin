var AppCtrl = function ($scope, AppsRelated, Role, $http, Service, $location, $timeout) {

    $('#alert_container').empty();
    Scope = $scope;
    Scope.alerts = [];
    Scope.currentServer = CurrentServer;
    Scope.action = "Create";
    setCurrentApp('applications');
    Scope.app = {is_url_external: "0", allow_fullscreen_toggle:0, requires_fullscreen: '0', roles: [], storage_service_id: null};
    $('#update_button').hide();
    $('.external').hide();

    Scope.storageOptions = [];

    Scope.Apps = AppsRelated.get(function () {
    }, function (response) {
        var code = response.status;
        if (code == 401) {
            window.top.Actions.doSignInDialog("stay");
            return;
        }
        var error = response.data.error;
        $.pnotify({
            title: 'Error',
            type: 'error',
            hide: false,
            addclass: "stack-bottomright",
            text: error[0].message
        });


    });
    Scope.Roles = Role.get(function () {
    }, function (response) {
        var code = response.status;
        if (code == 401) {
            window.top.Actions.doSignInDialog("stay");
            return;
        }
        var error = response.data.error;
        $.pnotify({
            title: 'Error',
            type: 'error',
            hide: false,
            addclass: "stack-bottomright",
            text: error[0].message
        });


    });
    Scope.Services = Service.get(function () {
        Scope.storageServices = [];
        Scope.storageContainers = {}
        Scope.Services.record.forEach(function (service) {

            if (service.type.indexOf("File Storage") != -1) {
                Scope.storageServices.push(service);

                $http.get('/rest/' + service.api_name + '?app_name=admin').success(function (data) {
                    Scope.storageContainers[service.id] = {options: []};
                    data.resource.forEach(function (container) {
                        if(service.api_name =="app"){
                            Scope.app.storage_service_id = service.id;
                            Scope.app.storage_container = "applications";
                            Scope.storageContainers[service.id].options.push({name: container.name});
                            Scope.storageContainers[service.id].name = service.api_name;
                            Scope.loadStorageContainers();
                        }else{
                            Scope.storageContainers[service.id].options.push({name: container.name});
                            Scope.storageContainers[service.id].name = service.api_name;
                        }

                    })

                });
            }



        });
    })

    Scope.loadStorageContainers = function () {
        Scope.storageOptions = [];
        Scope.storageOptions = Scope.storageContainers[Scope.app.storage_service_id].options;




    }
    Scope.formChanged = function () {
        $('#save_' + this.app.id).removeClass('disabled');
    };
    Scope.promptForNew = function () {
        Scope.action = "Create";
        Scope.app = {is_url_external: '0', requires_fullscreen: '0', roles: []};
        $('#context-root').show();
        $('#file-manager').hide();
        $('#app-preview').hide();
        $('#step1').show();
        $('#create_button').show();
        $('#update_button').hide();
        $("tr.info").removeClass('info');
        $(window).scrollTop(0);
    };
    Scope.save = function () {

        var id = Scope.app.id;
        AppsRelated.update({id: id}, Scope.app, function () {
                updateByAttr(Scope.Apps.record, 'id', id, Scope.app);

                window.top.Actions.updateSession("update");

                $.pnotify({
                    title: Scope.app.name,
                    type: 'success',
                    text: 'Updated Successfully'
                });
                $(document).scrollTop();
                Scope.promptForNew();

            },
            function (response) {
                var code = response.status;
                if (code == 401) {
                    window.top.Actions.doSignInDialog("stay");
                    return;
                }
                var error = response.data.error;
                $.pnotify({
                    title: 'Error',
                    type: 'error',
                    hide: false,
                    addclass: "stack-bottomright",
                    text: error[0].message
                });


            });
    };
    Scope.goToImport = function () {
        $location.path('/import');
    }
    Scope.create = function () {

        AppsRelated.save(Scope.app, function (data) {
                Scope.Apps.record.push(data);
                //Scope.app.id = data.id;
                //Scope.app = data;
                window.top.Actions.updateSession("update");
                $.pnotify({
                    title: Scope.app.name,
                    type: 'success',
                    text: 'Created Successfully'
                });
                Scope.promptForNew();
                Scope.showAppPreview(data.launch_url);
            },
            function (response) {
                var code = response.status;
                if (code == 401) {
                    window.top.Actions.doSignInDialog("stay");
                    return;
                }
                var error = response.data.error;
                $.pnotify({
                    title: 'Error',
                    type: 'error',
                    hide: false,
                    addclass: "stack-bottomright",
                    text: error[0].message
                });


            });


    };

    Scope.delete = function () {
        var which = this.app.name;
        if (!which || which == '') {
            which = "the application?";
        } else {
            which = "the application '" + which + "'?";
        }
        if (!confirm("Are you sure you want to delete " + which)) {
            return;
        }
        var id = this.app.id;
        AppsRelated.delete({ id: id }, function () {
                $("#row_" + id).fadeOut();
                window.top.Actions.updateSession();

                Scope.promptForNew();
                $.pnotify({
                    title: Scope.app.name,
                    type: 'success',
                    text: 'Removed Successfully'
                });
            },
            function (response) {
                var error = response.data.error;
                $.pnotify({
                    title: 'Error',
                    type: 'error',
                    hide: false,
                    addclass: "stack-bottomright",
                    text: error[0].message
                });


            });
    };
    Scope.postFile = function (target) {
        console.log(target);
    }
    Scope.showLocal = function () {
        $('.local').show();
        $('.external').hide();
    };
    Scope.hideLocal = function () {
        $('.local').hide();
        $('.external').show();
    };
    Scope.showFileManager = function () {
        Scope.action = "Edit Files for this";
        $('#step1').hide();
        $('#app-preview').hide();
        $('#create_button').hide();
        $('#update_button').hide();
        $("#file-manager").show();
        $("#file-manager iframe").css('height', $(window).height() - 200).attr("src", CurrentServer + '/public/admin/filemanager/?path=/app/' + this.app.api_name + '/&allowroot=false').show();
    };
    Scope.showAppPreview = function (appUrl) {

        Scope.action = "Preview ";
        $('#step1').hide();

        $("#app-preview").show();


        $("#app-preview  iframe").css('height', $(window).height() - 200).attr("src", appUrl).show();
        $('#create_button').hide();
        $('#update_button').hide();
        $('#file-manager').hide();
    };

    Scope.showDetails = function () {
        Scope.app = {};
        Scope.action = "Update";
        Scope.app = this.app;
        //Scope.loadStorageContainers();
        $('#button_holder').hide();
        $('#file-manager').hide();
        $('#app-preview').hide();
        $('#step1').show();
        $('#create_button').hide();
        $('#update_button').show();
        $("tr.info").removeClass('info');
        $('#row_' + Scope.app.id).addClass('info');
    }
    Scope.isAppInRole = function () {
        var inGroup = false;
        if (Scope.app) {
            var id = this.role.id;
            var assignedRoles = Scope.app.roles;
            assignedRoles = $(assignedRoles);

            assignedRoles.each(function (index, val) {
                if (val.id == id) {
                    inGroup = true;
                }
            });

        }
        return inGroup;
    };
    Scope.addRoleToApp = function (checked) {

        if (checked == true) {
            Scope.app.roles.push(this.role);
        } else {
            Scope.app.roles = removeByAttr(Scope.app.roles, 'id', this.role.id);
        }
    };

    Scope.reload = function () {
        Scope.Apps = AppsRelated.get();
    }
    $(window).resize();
};

