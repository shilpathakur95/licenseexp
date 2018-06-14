(function () {
    var primeBaseUrl = "https://captivateprime.adobe.com";
    var primeApiBaseUrl = primeBaseUrl + "/primeapi/v2";
    var app_id = "9ed96675-162b-44fe-9c72-dcf02a5615cf";
    var linkedinRedirectURI = 'https: //s3.amazonaws.com/hosted_data/LinkedInPOC/linkedin-learner-exp/index.html';
    var logInUrl = '%2Faccountiplogin%3FipId%3D2770%26accesskey%3Dj6i06kr8o8r';
    var accessToken = '';
    var token_url = primeBaseUrl + "/oauth/token";
    var app_secret = "bb4afc86-b182-4754-8b98-95516ebb1096";
    // var linkedinApiBaseURL = "api.linkedin.com";
    // var linkedinTokenURL = "https://www.linkedin.com/oauth/v2/accessToken";
    // var linkedinSecretId = "cvSTlYFGqlUJcImR";
    //var redirectURI = "http://127.0.0.1:34789/index.html";
    //var linkedinAccessToken = '';
    // var userEmail = '';

    /*var getURLParameter = function (sParam) {
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

    var getUserEmail = function () {
        if (linkedinAccessToken == '')
            linkedinAccessToken = localStorage.getItem('linkedinAccessToken');
        //var data = {};
        var url = linkedinApiBaseURL + "/v1/people/~:(emailAddress)?oauth2_access_token=" + linkedinAccessToken + "&format=json";
        $.ajax({
            "url": url,
            "method": 'GET'
        }).done(function (data) {
            if (console && console.log) {
                console.log("Got data:", data);
                //callback(data);
            }
        });
    }

    jQuery(document).ready(function () {
        var state = getURLParameter('state');
        if (state != null && state == 'state1') {
            var code = getURLParameter('code');
            var data = {};
            data.grant_type = 'authorization_code';
            data.code = code;
            data.client_id = linkedinAppId;
            data.client_secret = linkedinSecretId;
            data.redirect_uri = redirectURI;


            $.ajax({
                type: "POST",
                url: linkedinTokenURL,
                data: data,
                success: function (data) {
                    console.log('abmahesh');
                    console.log(data);
                    linkedinAccessToken = data.access_token;
                    localStorage.setItem('linkedinAccessToken', linkedinAccessToken);
                    init();
                    getUserEmail();
                },
                failure: function () {
                    console.log('onFailure');
                }
            });
        }
    });
*/



    function blockUI() {
        document.getElementById('opacity-provider').style.display = "block";
    }

    window.addEventListener("message", function (event) {
        if (event.data == "status:close") {
            //document.getElementsByTagName('body')[0].removeChild(document.getElementById('thumbnail-video'));
            //document.getElementById('opacity-provider').style.display = "none";

            document.getElementById("id_featured-course_thumbnail").setAttribute("style", "text-align:center;display:block");
            document.getElementById("id_featured-course_iframe_parent").setAttribute("style", "text-align:center;display:none;width:100%");
        }
    });

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

    var getToken = function () {
        var code = getURLParameter('code');
        if (!code)
            return;
        var data = {};
        data.code = code;
        data.client_id = app_id;
        data.client_secret = app_secret;

        return $.ajax({
            type: "POST",
            url: token_url,
            data: data,
            success: function (data) {
                console.log(data);
                accessToken = data.access_token;
                localStorage.setItem('accessToken', accessToken);
            },
            failure: function () {
                console.log('onFailure');
            }
        });


    }
    var populateFeaturedCourseMetadata = function () {

        getToken().then(function (data) {
            var path = '/learningObjects?include=enrollment&include=instances&page[limit]=10&filter.learnerState=enrolled,completed,started&sort=dueDate';
            var method = 'GET';
            $.ajax({
                "url": primeApiBaseUrl + path,
                "method": method,
                "headers": {
                    "Authorization": "oauth " + accessToken
                }
            }).done(function (data) {
                if (console && console.log) {
                    console.log("Got data:", data);
                    var firstCourseId = data['data'][0].id;
                    document.getElementById("id_featured_course_title").innerHTML = data['data'][0].attributes.localizedMetadata[0].name;
                }
            });
        });


    };

    var getFirstCourse = function () {
        var path = '/learningObjects?include=enrollment&include=instances&page[limit]=10&filter.learnerState=enrolled,completed,started&sort=dueDate';
        var method = 'GET';
        $.ajax({
            "url": primeApiBaseUrl + path,
            "method": method,
            "headers": {
                "Authorization": "oauth " + accessToken
            }
        }).done(function (data) {
            if (console && console.log) {
                console.log("Got data:", data);
                var firstCourseId = data['data'][0].id;
                onCourseClick(firstCourseId);
            }
        });
    };


    var startPlayback = function () {

        if (accessToken.length > 0) {
            getFirstCourse();
        } else {
            getToken().then(function (data) {
                getFirstCourse();
            });
        }

    };

    function validateLogin(event) {
        window.location = primeBaseUrl + '/oauth/o/authorize?response_type=code&redirect_uri=' + linkedinRedirectURI + '&realm=1&client_id=' + app_id + '&scope=learner:read,learner:write&loginUrl=' + logInUrl;
    }

    function detectMob() {
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


    function onCourseClick(courseId) {
        //var elFrame = document.createElement('iframe');
        //elFrame.id = "thumbnail-video";
        //elFrame.src = primeBaseUrl + "/app/player?lo_id=" + courseId + "&access_token=" + accessToken;
        //document.getElementsByTagName('body')[0].appendChild(elFrame);
        //document.getElementById('thumbnail-video').setAttribute('style', 'position: absolute; display: block; width: 912px; height: 484px; z-index: 1001; background: lightgrey; margin-left: 14%; margin-top: -46%;');
        //blockUI();

        var elFrame = document.getElementById('id_featured-course_iframe');
        elFrame.src = primeBaseUrl + "/app/player?lo_id=" + courseId + "&access_token=" + accessToken;

        document.getElementById("id_featured-course_thumbnail").setAttribute("style", "text-align:center;display:none");
        document.getElementById("id_featured-course_iframe_parent").setAttribute("style", "text-align:center;display:block;");

        if (!detectMob()) {
            document.getElementById("id_featured-course_iframe").setAttribute("height", "400");
            document.getElementById("id_featured-course_iframe").setAttribute("width", "70%");
        } else {
            document.getElementById("id_featured-course_iframe").setAttribute("height", "250");
            document.getElementById("id_featured-course_iframe").setAttribute("width", "100%");
        }


    }

    function init() {
        populateFeaturedCourseMetadata();
        document.getElementById('course-thumbnail').addEventListener("click", startPlayback, false);
    }
    init();
})();
