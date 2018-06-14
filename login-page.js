(function () {
    var app_id = "9ed96675-162b-44fe-9c72-dcf02a5615cf";
    var logInUrl = '%2Faccountiplogin%3FipId%3D2770%26accesskey%3Dj6i06kr8o8r';
    var primeBaseUrl = "https://captivateprime.adobe.com"
    var accId = 37949;
    var isLocal = false; //set this flag when working locally
    var linkedinRedirectURI = '';
    if (isLocal == true)
        linkedinRedirectURI = 'http://localhost:8080/home.html';
    else
        linkedinRedirectURI = 'https://learnerexp.herokuapp.com/home.html'; //hosted URL goes here

    var getURLParameter = function (sParam) {
        var sPageURL = decodeURIComponent(window.location.search.substring(1)),
            sURLVariables = sPageURL.split('?'),
            sParameterName,
            i;

        console.log(sURLVariables);
        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : sParameterName[1];
            }
        }
    };

    var redirectParameter = getURLParameter('redirect');
    if (redirectParameter == 'mylearning') {
        if (isLocal)
            linkedinRedirectURI = 'http://localhost:8080/my-learning.html';
        else
            linkedinRedirectURI = 'https://learnerexp.herokuapp.com/my-learning.html'
    } else if (redirectParameter == 'myCatalog') {
        if (isLocal)
            linkedinRedirectURI = 'http://localhost:8080/my-catalog.html';
        else
            linkedinRedirectURI = 'https://learnerexp.herokuapp.com/my-catalog.html'
    }

    window.location = primeBaseUrl + '/oauth/o/authorize?response_type=code&redirect_uri=' + linkedinRedirectURI + '&realm=1&client_id=' + app_id + '&scope=learner:read,learner:write';
})();
