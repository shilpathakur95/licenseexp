(function () {
    var primeBaseUrl = "https://captivateprime.adobe.com";
    var primeApiBaseUrl = primeBaseUrl + "/primeapi/v2";
    var token_url = primeBaseUrl + "/oauth/token";
    var app_secret = "bb4afc86-b182-4754-8b98-95516ebb1096";
    var app_id = "9ed96675-162b-44fe-9c72-dcf02a5615cf";
    var accessToken = ""; //localStorage.getItem('accessToken')"";
    var firstCourseId = "";
    var g_winWidth = window.innerWidth;
    var g_winHeight = window.innerHeight;
    if (g_winWidth > g_winHeight) {
        var x = g_winWidth;
        g_winWidth = g_winHeight;
        g_winHeight = g_winWidth;
    }
    window.prime = window.prime || {};
    var prime = window.prime;
    var openPlayerId = '';
    prime.proxyMode = prime.proxyMode || true;
    if (prime.proxyMode && !window.Proxy) {
        alert("Proxy mode is not supported. Using traditional getter method");
        prime.proxyMode = false;
    }

    var isMobile = {
        Android: function () {
            return navigator.userAgent.match(/Android/i);
        },
        BlackBerry: function () {
            return navigator.userAgent.match(/BlackBerry/i);
        },
        iOS: function () {
            return navigator.userAgent.match(/iPhone|iPad|iPod/i);
        },
        Opera: function () {
            return navigator.userAgent.match(/Opera Mini/i);
        },
        Windows: function () {
            return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
        },
        any: function () {
            return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
        }
    };


    var getURLParameter = function (sParam) {
        var sPageURL = decodeURIComponent(window.location.search.substring(1)),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : sParameterName[1];
            }
        }
    };

    jQuery(document).ready(function () {
        var code = getURLParameter('code');
        var data = {};
        data.code = code;
        data.client_id = app_id;
        data.client_secret = app_secret;

        $.ajax({
            type: "POST",
            url: token_url,
            data: data,
            success: function (data) {
                console.log(data);
                accessToken = data.access_token;
                localStorage.setItem('accessToken', accessToken);
                init();
            },
            failure: function () {
                console.log('onFailure');
            }
        });
    });

    ///////////////////////////////////////JSON API DATA ACCESSING Utils- BEGIN///////////////////////////////
    prime.store = new Store();
    prime.ObjectWrapper = ObjectWrapper;

    function Store() {
        this.cache = {};
    }
    Store.prototype.get = function (type, id) {
        if (!this.cache[type])
            this.cache[type] = {};

        return this.cache[type][id];
    }
    Store.prototype.put = function (obj) {
        if (!this.cache[obj['type']])
            this.cache[obj['type']] = {};

        this.cache[obj['type']][obj['id']] = obj;
    }

    function ObjectWrapper(type, id) {
        this.id = id;
        this.type = type;
        this.dataObj = prime.store.get(type, id);
    }
    ObjectWrapper.prototype.get = function (attr) {
        if (attr == 'id') return this.id;
        if (attr == 'type') return this.type;

        if (this.dataObj === undefined)
            return;

        var retval;
        if (this.dataObj.hasOwnProperty('attributes')) //check in attributes
        {
            retval = this.dataObj['attributes'].hasOwnProperty(attr) ? this.dataObj['attributes'][attr] : undefined;
        }
        if (retval === undefined && this.dataObj.hasOwnProperty('relationships')) //check in relationships
        {
            retval = this.dataObj['relationships'][attr];
            if (retval !== undefined) {
                var relData = retval['data'];
                if (Array.isArray(relData)) {
                    retval = [];
                    var oneObj;
                    for (var ii = 0; ii < relData.length; ++ii) {
                        oneObj = relData[ii];
                        retval.push(getWrapper(oneObj['type'], oneObj['id']));
                    }
                } else
                    retval = getWrapper(relData['type'], relData['id']);
            }
        }
        return retval;
    }

    function getWrapper(type, id) {
        var objWrapper = new ObjectWrapper(type, id);
        if (prime.proxyMode) {
            objWrapper = new Proxy(objWrapper, {
                get: function (target, attr, receiver) {
                    return target.get(attr);
                }
            });
        }
        return objWrapper;
    }

    prime.parse = function (jsonApiResponse) {
        if (typeof jsonApiResponse == "string")
            jsonApiResponse = JSON.parse(jsonApiResponse); //parse into javascript object if its a string

        if (Array.isArray(jsonApiResponse.included)) //dump everything else into store for later access
        {
            for (var ii = 0; ii < jsonApiResponse.included.length; ++ii) {
                prime.store.put(jsonApiResponse.included[ii]);
            }
        }

        var result;
        var data = jsonApiResponse['data'];
        if (Array.isArray(data)) //returns an Array of ObjectWrapper instances 
        {
            result = [];
            var oneObj;
            for (var ii = 0; ii < data.length; ++ii) {
                oneObj = data[ii];
                prime.store.put(oneObj);
                result.push(getWrapper(oneObj['type'], oneObj['id']));
            }
        } else //returns a single ObjectWrapper instance
        {
            prime.store.put(data);
            result = getWrapper(data[ii]['type'], data[ii]['id']);
        }

        var retval = {}
        retval['data'] = result;
        retval['links'] = jsonApiResponse['links'];
        return retval;
    };

    prime.makeApiCall = function (method, path, callback) {
        //Using jquery here as linkedin.com is having jquery; if not convert to vanilla javascript
        $.ajax({
            "url": primeApiBaseUrl + path,
            "method": method,
            "headers": {
                "Authorization": "oauth " + accessToken
            }
        }).done(function (data) {
            if (console && console.log) {
                console.log("Got data:", data);
                callback(data);
            }
        });
    };
    var cpListId = "cp-ul-list";
    var cpPlayerId = "cp-player";
    var elFrame;
    var currentLOPlayed = "";
    var instanceIdMap = [];
    var enrollmentDataMap = [];
    var skillsMap = [];

    document.getElementById("loSearchBar").addEventListener("search", function () {
        var x = document.getElementById("loSearchBar");
        if (x.value != "") {
            searchLOs();
        } else {
            getLoList();
        }
    });


    function launchIntoFullscreen(element) {
        if (element.requestFullscreen) {
            //alert("1");
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
            //alert("2");
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
            //alert("3");
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
            //alert("4");
            element.msRequestFullscreen();
        }
    }

    window.addEventListener("orientationchange", function () {

        //alert(openPlayerId + "," + screen.orientation.angle)
        if (screen.orientation.angle == 90 || screen.orientation.angle == 270) {
            if (openPlayerId != null && openPlayerId != undefined && openPlayerId.length > 0) {
                //alert("trying to open in fullscreen")
                launchIntoFullscreen(document.getElementById(openPlayerId));
            }
        }
    });

    function searchLOs() {
        var x = document.getElementById("loSearchBar");
        document.getElementById("myLearningLogo").innerHTML = "Search Results";
        prime.makeApiCall('GET', "/search?query=" + x.value + "&autoCompleteMode=true&include=model.enrollment&include=model.instances&include=model.skills", function (response) {
            var data = prime.parse(response)['data'];
            var enrollmentStatus = response.included;
            if (data.length > 0) {
                var html = '<ul style="list-style-type: none;" id=' + cpListId + '>';
                for (var ii = 0; ii < data.length; ii++) {
                    var group2Id = 'group-2' + data[ii].id;
                    var listNameId = 'list-' + data[ii].id;
                    var buttonId = 'button-' + data[ii].id;
                    var dateId = "date-" + data[ii].id;
                    var skill = "skill-" + data[ii].id;
                    var desc = "";
                    var buttonStyle = "buttonStyle-mobile large-primary-button";
                    if (isMobile.any()) {
                        //alert("mobile browser");
                        buttonStyle = "buttonStyle-mobile large-primary-button";
                    }

                    if (data[ii].description) {
                        //desc = data[ii].description;
                    } else {
                        desc = "";
                    }

                    html += '<div id=' + group2Id + ' class="group-2"><li id=' + listNameId + ' class="listStyle">' + data[ii].name + '</li><button class=' + '"' + buttonStyle + '"' + ' id=' + buttonId + '>Play</button><p class="desc">' + desc + '</p><br/><p id=' + skill + '>Skills: General</p><p class="due-date" id=' + dateId + '>Due Date</p><iframe webkitAllowFullScreen webkitallowfullscreen webkitallowfullscreen="" webkitallowfullscreen="true"  mozAllowFullScreen allowFullScreen style="display: none;" id="cp-player"></iframe><div class="line2"></div></div>';
                }
                html += "</ul>";
                document.getElementById("loList").innerHTML = html;
                var instanceData;
                for (var ii = 0; ii < data.length; ii++) {
                    skillData = enrollmentStatus.map(function (value) {
                        var courseId = value.id.substr(0, value.id.indexOf("_"));
                        if (value.type === "learningObjectSkill" && courseId == data[ii].id) {
                            return value;
                        }
                    });
                    skillData = skillData.filter(function (val) {
                        return val;
                    });
                    var skillId = skillData[0].id.split("_")[1];
                    if (skillsMap[skillId]) {
                        var skill = "skill-" + data[ii].id;
                        document.getElementById(skill).innerHTML = "Skills: " + skillsMap[skillId];
                    } else {
                        getSkillName(data[ii].id, skillId);
                    }

                    var buttonLabel = "Play";
                    var listNameId = 'list-' + data[ii].id;
                    var buttonId = 'button-' + data[ii].id;
                    var dateId = "date-" + data[ii].id;
                    enrollmentData = enrollmentStatus.map(function (value) {
                        var courseId = value.id.substr(0, value.id.indexOf("_"));
                        if (value.type === "learningObjectInstanceEnrollment" && courseId == data[ii].id) {
                            return value;
                        }
                    });
                    enrollmentData = enrollmentData.filter(function (val) {
                        return val;
                    });
                    if (enrollmentData[0]) {
                        enrollmentDataMap[data[ii].id] = true;
                    } else {
                        enrollmentDataMap[data[ii].id] = false;
                        buttonLabel = "Enroll";
                    }
                    instanceData = enrollmentStatus.map(function (value) {
                        var courseId = value.id.substr(0, value.id.indexOf("_"));
                        if (value.type === "learningObjectInstance" && courseId == data[ii].id) {
                            return value;
                        }
                    });
                    instanceData = instanceData.filter(function (val) {
                        return val;
                    });
                    if (instanceData[0]) {
                        instanceIdMap[data[ii].id] = instanceData[0].id;
                        if (instanceData[0].attributes.completionDeadline) {
                            var date = new Date(instanceData[0].attributes.completionDeadline);
                            document.getElementById(dateId).innerHTML = "Due: " + date.toLocaleDateString();
                        }
                    }
                    if (data[ii].progressPercent == 0) {
                        buttonLabel = "Start";
                    } else if (data[ii].progressPercent == 100) {
                        buttonLabel = "Revisit";
                    } else if (data[ii].progressPercent >= 0 && data[ii].progressPercent <= 100) {
                        buttonLabel = "Continue";
                    }

                    document.getElementById(buttonId).innerHTML = buttonLabel;
                    document.getElementById(listNameId).addEventListener("click", onCourseClick, false);
                    document.getElementById(buttonId).addEventListener("click", onCourseClick, false);
                }
            } else {
                document.getElementById("loList").innerHTML = "<div class='errorMsg'>Nothing found related to <b>" + x.value + "</b>.</div>";
            }
        });
    }

    function getLoList() {
        //document.getElementById("myLearningLogo").innerHTML = "My Learning";
        prime.makeApiCall('GET', "/learningObjects?include=enrollment&include=instances&page[limit]=10&filter.learnerState=enrolled,completed,started&sort=dueDate", function (response) {
            var data = prime.parse(response)['data'];
            if (response.data.length <= 0) {
                document.getElementById("loList").innerHTML = "<div class='errorMsg'>No enrollments found.</div";
                return;
            }
            var enrollmentStatus = response.included;
            var html = '<ul class="list-unstyled" id=' + cpListId + '>';
            firstCourseId = data[0].id;
            for (var ii = 0; ii < data.length; ii++) {
                var group2Id = 'group-2' + data[ii].id;
                var listNameId = 'list-' + data[ii].id;
                var buttonId = 'button-' + data[ii].id;
                var dateId = "date-" + data[ii].id;
                var skill = "skill-" + data[ii].id;
                var playerId = "player-" + data[ii].id;
                var desc = "";
                var imageUrl = "";
                if (data[ii].description) {
                    //desc = data[ii].description;
                } else {
                    desc = "";
                }
                if (response.data[ii].attributes.imageUrl) {
                    imageUrl = response.data[ii].attributes.imageUrl;
                } else {
                    var x = (data[ii].id.split(':')[1]) % 3;
                    if (x != NaN)
                        imageUrl = 'images/colourImage-' + x + '.png';
                    else
                        imageUrl = 'images/colourImage-2.png';
                }

                if (isMobile.any()) {
                    html += '<div id=' + group2Id + '><div class="row" style="padding-top:5px"><div class="media col-9" ><img class="mr-3" src=' + imageUrl + ' alt="thumbnail" width="64px" height="64px"><div class="media-body"><div class="mt-0 mb-1 course_title" id="course_title">' + data[ii].localizedMetadata[0].name + '</div>' + desc + '</div></div><div class="col-3" style="padding:0px;padding-right:10px"><button type="button" class="btn large-primary-button buttonStyle-mobile" style="width:100%;font-size:12px" id=' + buttonId + '>Play</button></div></div><div class="row"><div class="col-8 skilllabel" id=' + skill + '>Skills : </div><div class="col-4 skilllabel" style="text-align:right" id=' + dateId + '>Due Date : </div><div class="col-1"></div></div><div class="row justify-content-center"><div class="col-12"><iframe mozAllowFullScreen  webkitAllowFullScreen webkitallowfullscreen webkitallowfullscreen="" webkitallowfullscreen="true" allowFullScreen style="display: none; width: 100%; height: 484px" id=' + playerId + '></iframe></div></div><div class="row justify-content-center"><div class="col-11 dropdown-divider" style="border-top:1px solid #444444;opacity:0.2;padding:10px"></div></div></div>';
                } else {
                    html += '<div id=' + group2Id + '><div class="row" style="padding-top:5px"><div class="media col-9" ><img class="mr-3" src=' + imageUrl + ' alt="thumbnail" width="64px" height="64px"><div class="media-body"><div class="mt-0 mb-1 course_title">' + data[ii].localizedMetadata[0].name + '</div>' + desc + '</div></div><div class="col-3" style="text-align: right"><button type="button" class="btn large-primary-button  buttonStyle-mobile" id=' + buttonId + '>Play</button></div></div><div class="row"><div class="col-8 " id=' + skill + '>Skills : </div><div class="col-4 " style="text-align:right" id=' + dateId + '>Due Date : </div><div class="col-1"></div></div><div class="row justify-content-center"><div class="col-12"><iframe scrolling="no" allowtransparency="true" webkitAllowFullScreen webkitallowfullscreen webkitallowfullscreen="" webkitallowfullscreen="true" mozAllowFullScreen  allowFullScreen style="display: none; width: 100%; height: 484px" id=' + playerId + '></iframe></div></div><div class="row" style=";padding:15px"><div class="col-12 dropdown-divider" style="border-top:1px solid #444444;opacity:0.2"></div></div></div>';
                }

            }
            html += "</ul>";
            document.getElementById("loList").innerHTML = html;
            var enrollmentData;
            var instanceData;
            var buttonLabel;
            for (var ii = 0; ii < data.length; ii++) {
                var skillId = response.data[ii].relationships.skills.data[0].id.split("_")[1];
                if (skillsMap[skillId]) {
                    var skill = "skill-" + data[ii].id;
                    console.log(document.getElementById(skill).innerHTML);
                    document.getElementById(skill).innerHTML = "Skills: " + skillsMap[skillId];
                } else {
                    getSkillName(data[ii].id, skillId);
                }
                var buttonId = "button-" + data[ii].id;
                var dateId = "date-" + data[ii].id;
                var listNameId = 'list-' + data[ii].id;
                enrollmentData = enrollmentStatus.map(function (value) {
                    var courseId = value.id.substr(0, value.id.indexOf("_"));
                    if (value.type === "learningObjectInstanceEnrollment" && courseId == data[ii].id) {
                        return value;
                    }
                });
                enrollmentData = enrollmentData.filter(function (val) {
                    return val;
                });
                if (enrollmentData[0]) {
                    enrollmentDataMap[data[ii].id] = true;
                } else {
                    enrollmentDataMap[data[ii].id] = false;
                    buttonLabel = "Enroll";
                }
                instanceData = enrollmentStatus.map(function (value) {
                    var courseId = value.id.substr(0, value.id.indexOf("_"));
                    if (value.type === "learningObjectInstance" && courseId == data[ii].id) {
                        return value;
                    }
                });
                instanceData = instanceData.filter(function (val) {
                    return val;
                });
                if (instanceData[0]) {
                    instanceIdMap[data[ii].id] = instanceData[0].id;
                    if (instanceData[0].attributes.completionDeadline) {
                        var date = new Date(instanceData[0].attributes.completionDeadline);
                        document.getElementById(dateId).innerHTML = "Due: " + date.toLocaleDateString();
                    }
                }
                if (enrollmentData[0].attributes.progressPercent == 0) {
                    buttonLabel = "Start";
                } else if (enrollmentData[0].attributes.progressPercent == 100) {
                    buttonLabel = "Revisit";
                } else if (enrollmentData[0].attributes.progressPercent >= 0 && enrollmentData[0].attributes.progressPercent <= 100) {
                    buttonLabel = "Continue";
                }
                document.getElementById(buttonId).innerHTML = buttonLabel;
                // document.getElementById(listNameId).addEventListener("click", onCourseClick, false);
                document.getElementById(buttonId).addEventListener("click", onCourseClick, false);
            }
        });
    }

    function getSkillName(courseId, skillId) {
        prime.makeApiCall('GET', "/skills/" + skillId, function (response) {
            //var data = prime.parse(response)['data'];
            var skill = "skill-" + courseId;
            document.getElementById(skill).innerHTML = "Skills: " + response.data.attributes.name;
            skillsMap[skillId] = response.data.attributes.name;
        });
    }

    function onCourseClick(event) {
        var courseId = event.target.id.substr(event.target.id.indexOf("-") + 1, event.target.id.length - 1);
        var buttonId = 'button-' + courseId;
        if (!enrollmentDataMap[courseId]) {
            enrollLO(courseId, instanceIdMap[courseId]);
        } else {
            playCourse(courseId);
        }
    }

    function enrollLO(courseId, courseInstanceId) {
        var url = primeApiBaseUrl + "/enrollments";
        var data = {};
        data.loId = courseId;
        data.loInstanceId = courseInstanceId;
        var buttonId = 'button-' + courseId;
        $.ajax({
            type: "POST",
            url: url,
            data: data,
            headers: {
                "Authorization": "oauth " + accessToken
            },
            success: function (data) {
                document.getElementById(buttonId).innerHTML = "Start";
                enrollmentDataMap[courseId] = true;
            },
            failure: function () {
                console.log('onFailure');
            }
        });
    }

    var detectMob = function () {
        if (navigator.userAgent.match(/Android/i) ||
            navigator.userAgent.match(/webOS/i) ||
            navigator.userAgent.match(/iPhone/i) ||
            navigator.userAgent.match(/iPad/i) ||
            navigator.userAgent.match(/iPod/i) ||
            navigator.userAgent.match(/BlackBerry/i) ||
            navigator.userAgent.match(/Windows Phone/i)
        ) {
            return true;
        } else {
            return false;
        }
    }

    function playCourse(courseId) {
        //var existingDiv = document.getElementById(cpPlayerId);
        // if(existingDiv)
        // 	existingDiv.parentNode.removeChild(existingDiv);
        if (openPlayerId) {
            document.getElementById(openPlayerId).setAttribute('style', 'display: none;');
            document.getElementById(openPlayerId).src = "";
        }
        var playerId = 'player-' + courseId;
        openPlayerId = playerId;
        elFrame = document.getElementById(playerId);
        var courseLink = primeBaseUrl + "/app/player?lo_id=" + courseId + "&access_token=" + accessToken;
        if (detectMob()) {
            var playerIframe = document.getElementById('playerIframe');
            playerIframe.src = courseLink;
            var winWidth = window.innerWidth;
            var winHeight = window.innerHeight;
            playerIframe.setAttribute('style', 'display: block;border: none;height: 100vh; width: 100vw');
            document.body.setAttribute('style', 'overflow-y:hidden');
            window.scrollTo(0, 0);
        } else {
            document.getElementById(playerId).setAttribute('style', 'display: block;z-index: 1001; background: lightgrey; width: 100%; height: 484px');
            elFrame.src = courseLink;
        }
        //        if (detectMob()) {
        //            var iFrame = document.getElementById(playerId);
        //            var x = iFrame.getBoundingClientRect().left;
        //            var y1 = iFrame.getBoundingClientRect().top;
        //
        //            window.scrollTo(x, y1);
        //   }
        //        var group2Id = 'group-2' + courseId;
        //        currentLOPlayed = courseId;
        //        document.getElementById(group2Id).setAttribute("style", "height: 650px; width: 381px;");
        //        document.getElementById(group2Id).appendChild(elFrame);

        //launchIntoFullscreen(document.getElementById(playerId));
    }

    window.addEventListener("message", function (event) {
        if (event.data == "status:close") {
            document.getElementById('playerIframe').setAttribute('style', 'display: none;');
            document.getElementById('playerIframe').src = "";
            document.body.setAttribute('style', 'overflow-y:auto');
            //            var group2Id = 'group-2' + currentLOPlayed;
            //            document.getElementById(group2Id).setAttribute("style", "height: 150px; width: 381px;")
            //            document.getElementById(group2Id).removeChild(elFrame);
        }
    });

    if (detectMob()) {
        window.addEventListener('resize', function () {
            var iFrame = document.getElementById('playerIframe');
            if ($('#playerIframe:visible').length != 0) {
                iFrame.setAttribute('style', 'height: 100vh; width: 100vw');
            }
            //            var winWidth = $(window).width();
            //            var winHeight = $(window).height();
            //            if (winWidth > winHeight) {
            //iFrame.
            //            } else {
            //                iFrame.setAttribute('style', 'width:' + g_winWidth + 'px; height: ' + g_winHeight + 'px');
            //            }
        });
    }

    function init() {
        getLoList();
    }
})();
