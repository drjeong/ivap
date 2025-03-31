<?php
require_once (dirname(__FILE__) . '/php_include/config.php');

if ($_SESSION['SYSTEM_ENVIRONMENT'] == Config::ENV_PHP_DESKTOP) {
    header("Location: login_chk.php");
}

?>
<!doctype html>
<html lang="en">
<head>
    <title>precipitation analysis</title>
    <meta charset="utf-8">
    <meta name="author" content="">
    <meta name="description" content="">

    <link rel="apple-touch-icon" sizes="180x180" href="./favicon_io/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="./favicon_io/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="./favicon_io/favicon-16x16.png">
    <link rel="manifest" href="./favicon_io/site.webmanifest">

    <link rel="stylesheet" type="text/css" href="./css/style-home.css" />
    <link rel="stylesheet" type="text/css" href="./toolbox/sweetalert2-10.12.6/package/dist/sweetalert2.css" />
    <link rel="stylesheet" type="text/css" href="./toolbox/bootstrap-3.3.5-dist/css/bootstrap.min.css">
    <link rel="stylesheet" type="text/css" href="./toolbox/jquery-ui-1.11.4.custom/jquery-ui.min.css" />

    <script src="./js/jquery-1.11.3.min.js"></script>
    <script src="./toolbox/sweetalert2-10.12.6/package/dist/sweetalert2.min.js"></script>
    <script src="./toolbox/bootstrap-3.3.5-dist/js/bootstrap.min.js"></script>
    <script src="./js/jsencrypt.js"></script>

 </head>

<link rel="stylesheet" type="text/css" href="./css/style-home.css" />

<script type="text/javascript">
    String.prototype.isEmpty = String.prototype.isEmpty || function() {
        return !(!!this.trim().length);
    }

    function chk()
    {
        if (form.email.value.isEmpty())
        {
            form.email.focus();
            Swal.fire({
                title: "ERROR",
                text: "Enter your email address!!",
                icon: "error"
            }).then(function(){
                form.email.focus();
            });
            return false;
        }
        if (form.pwd.value.isEmpty())
        {
            form.pwd.focus();
            Swal.fire({
                title: "ERROR",
                text: "Enter your Password!!",
                icon: "error"
            }).then(function(){
                form.pwd.focus();
            });
            return false;
        }
        return true;
    }

    function CheckCredential()
    {
        if (chk() === false) return false;

        var email = form.email.value;
        var pwd = form.pwd.value;

        if (window.XMLHttpRequest) {
            // code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp=new XMLHttpRequest();
        } else { // code for IE6, IE5
            xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
        }
        xmlhttp.onreadystatechange=function() {
            if (xmlhttp.readyState==4 && xmlhttp.status==200) {
                switch(xmlhttp.responseText.trim())
                {
                    case "0x11111111":
                        location.href = "main.php";
                        break;
                    case "0x61001010":
                        Swal.fire({
                            title: "ERROR",
                            text: "We cannot process your login credentials. Please contact the system administrator!!",
                            icon: "error"
                        });
                        break;
                    case "0x21031010":
                        Swal.fire({
                            title: "ERROR",
                            text: "Your account has been disabled. Please contact the system administrator!!",
                            icon: "error"
                        });
                        break;
                    case "0x31031010":
                        Swal.fire({
                            title: "ERROR",
                            text: "Your account is waiting for approval.",
                            icon: "error"
                        });
                        break;
                    default:
                        Swal.fire({
                            title: "ERROR",
                            text: "Not able to process your login credential!!",
                            icon: "error"
                        });
                        break;
                }
            }
        }
        xmlhttp.open("POST", "login_chk.php", true);
        xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xmlhttp.send("email="+email+"&pwd="+encodeURIComponent(pwd));

        return false;
    }

</script>

<body>


<table  class="pagebacklayout_top" height="60" align="center" border="0" cellpadding="0" cellspacing="0">
    <tr style="background-image: url('./images/banner_bg_repeat.jpg'); background-repeat: repeat;"><td height="5" colspan="3"></td></tr>
    <tr style="background-image: url('./images/banner_bg_repeat.jpg'); background-repeat: repeat;">
        <td style="width:5px;"><img src="./images/UDC_Logo_Horizontal_White.svg" class="svgshadow" style="height:30px; text-align: left""></td>
    </tr>
    <tr style="background-image: url('./images/banner_bg_repeat.jpg'); background-repeat: repeat;">
        <td height="90" width="100%" align="center" valign="top" style="background-repeat: no-repeat; background-size: 400px;padding:  10px;">
            <div style="width:100%; padding:20px;"><span style="color:white; font-size: 40px;text-shadow: 2px 2px #000000;">Online Hourly Precipitation Analysis System</span></div>
        </td>
        <td></td>
    </tr>
    <tr style="background-image: url('./images/banner_bg_repeat.jpg'); background-repeat: repeat;"><td height="5" colspan="3"></td></tr>
    <tr>
        <td height="5" colspan="3"><hr id="dottedline" /></td>
    </tr>
    <tr style="background-color: white;">
        <td height="80%" colspan="3" valign="top" align="center">
            <!-- Information Should be here BEGIN-->

            <table width="950" border="0" align="center" cellpadding="0" cellspacing="0">
                <tr>
                    <td colspan=3 valign="top">
                        <table height="500" width="100%" valign="top" cellspacing="0" cellpadding="0"  border="0">
                            <tr>
                                <td valign="top" align="middle"><br><br>
                                    <h4>Online Hourly Precipitation Analysis System</h4></br></br>
                                    <form name='form' action='' onsubmit="CheckCredential();return false;">
                                        <div class="input-group input-group-sm" style="width:500px">
                                            <span class="input-group-addon" id="sizing-addon1" style="width:150px">EMAIL ADDRESS</span>
                                            <input type="email" name="email" pattern="^[^ ]+@[^ ]+\.[a-z]{2,6}$" class="form-control" placeholder="UDC Email Address" aria-describedby="sizing-addon1">
                                        </div>

                                        <div class="input-group input-group-sm" style="width:500px">
                                            <span class="input-group-addon" id="sizing-addon1" style="width:150px">PASSWORD</span>
                                            <input type="password" name="pwd" class="form-control" placeholder="Enter Your Password" aria-describedby="sizing-addon1">
                                        </div>

                                        <br/>

                                        <div class="input-group input-group-sm">
                                            <input class="btn btn-primary" type='submit' value='LOGIN' style='color:white;background-color:#336699;border-width:1px;'>&nbsp;&nbsp;<input class="btn btn-default" type=reset value='RESET' style='color:white;background-color:#336699;border-width:1px;'>
                                        </div>

                                </td>
                            </tr>
                        </table>
                </tr>
            </table>
        </td>
    </tr>
</table>

<!-- Footer -->
<footer class="sticky-footer bg-white">
    <div class="container my-auto">
        <div class="copyright text-center my-auto">
            <span lang=EN-US style='font-size:8.0pt;font-family:Arial;color:white; text-shadow: 2px 2px 4px #FFFFFF;'>University of the District of Columbia<br/>
                4200 Connecticut Avenue NW | Washington, DC 20008 | 202.274.5000<br/>
                Copyright &copy; 2023~<?php echo(date("Y",time()));?> All Rights Reserved</span>
        </div>
    </div>
</footer>
<!-- End of Footer -->

</body>
</html>
