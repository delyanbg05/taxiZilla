//Deklarirane na promenlivi
const keyLoginInfo = `=kwZZPNDc*Xx#fm=Mc+6wVvLu3wsA3SP`;
function rememberMe(username, password, type)//Funkciq za zapazvane na login info na potrebitel ili firma
{
    if(arguments.callee.caller === null) {console.log("%c You are not permitted to use this method!!!",  'color: red'); return;}
    const credentials = {username:username, password: password, type:type};
    setCookie("rememberMe", CryptoJS.AES.encrypt(JSON.stringify(credentials), keyLoginInfo, { mode: CryptoJS.mode.CFB }).toString(), 150000 * 24 * 60);
}
function setLastPage(pageName)//Funkciq za zapazvane na poslednata stranica
{
   localStorage.setItem("lastPage", CryptoJS.AES.encrypt(pageName, keyLoginInfo, { mode: CryptoJS.mode.CFB }).toString());
}
function getLastPage()//Funkciq za vzemane na imeto na poslednata stranica
{
    return CryptoJS.AES.decrypt(localStorage.getItem("lastPage"), keyLoginInfo, { mode: CryptoJS.mode.CFB }).toString(CryptoJS.enc.Utf8);
}
function checkForLastPage()//Funkciq za proverka na posledna stranica i otvarqne sled relog
{
    if(localStorage.getItem("isReLogged") == "true")
    {
        switch (getLastPage()) {
            case "adminPanel":
                adminPanelPage();
                
                break;
            case "modPanel":
                modPanelPage();
                
                break;
            case "adminPanel":
                adminPanelPage();
                
                break;
            case "makeOrder":
                makeOrderPage();
                    
                break;
            case "profile":
                profilePage();
                    
                break;
            case "profileDriver":
                profileDriverPage();
                    
                break;
            case "profileFirm":
                profileFirmPage();
                    
                break;
        }
        localStorage.removeItem("isReLogged");
    }
}
function setCookie(cname, cvalue, exmin)//Funkciq za suzdavane na cookie
{
    if(arguments.callee.caller === null) {console.log("%c You are not permitted to use this method!!!",  'color: red'); return;}
    var d = new Date();
    d.setTime(d.getTime() + (exmin * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/;secure;";
}
function deleteCookie(cname)//Fuknkciq za iztrivane na cookie po ime
{
    if(arguments.callee.caller === null) {console.log("%c You are not permitted to use this method!!!",  'color: red'); return;}
    document.cookie = `${cname}=;expires=Thu, 01 Jan 1970`;
}
function getCookie(cname)//Funkciq za vzemane na cookie po ime
{
    if(arguments.callee.caller === null) {console.log("%c You are not permitted to use this method!!!",  'color: red'); return;}
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}
function decryptLoginInfoAndLogin(is401)//Funkciq za avtomatichen login
{
    if(arguments.callee.caller === null) {console.log("%c You are not permitted to use this method!!!",  'color: red'); return;}
    var cred = getCookie("rememberMe");
    var lastPage = getCookie("lastPage");
    if(cred != "" && (is401 || loginInfo["isLoggedIn"] == "false"))
    {
        var credentials = CryptoJS.AES.decrypt(cred, keyLoginInfo, { mode: CryptoJS.mode.CFB }).toString(CryptoJS.enc.Utf8);
        credentials = JSON.parse(credentials);
        const username = credentials["username"];
        const password = credentials["password"];
        const type = credentials["type"];
        if(type.toString(CryptoJS.enc.Utf8) == "User")
        {
            getServerDate().then(dateServer =>{
            postRequest("/auth/loginUser",
            {
                email: username,
                password: password,
                key: algorithm(),
                offset: dateServer["offset"]
            },
            ).then(data=>
            {
                if(data=="true") refreshPage();
                else
                {
                    deleteCookie("rememberMe");
                    deleteCookie("lastPage");
                }
            });
            });
        }
        else if(type.toString(CryptoJS.enc.Utf8) == "Firm")
        {
            getServerDate().then(dateServer =>{
            postRequest("/firm/loginFirm",
            {
                eik: username,
                password: password,
                key: algorithm(),
                offset: dateServer["offset"]
            }).then(data=>
            {
                if(data=="true")
                {
                    refreshPage();
                }
                else
                {
                    deleteCookie("rememberMe");
                    deleteCookie("lastPage");
                }
            }
            );
            });
        }
    }
}
function logOut()//Funkciq za logout
{
    if(arguments.callee.caller === null) {console.log("%c You are not permitted to use this method!!!",  'color: red'); return;}
    deleteCookie("rememberMe");
    deleteCookie("lastPage");
    window.location = "./logout";
}