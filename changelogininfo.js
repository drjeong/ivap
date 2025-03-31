/**
 * Title: Change Login Information
 * File: changelogininfo.js
 * Author: Dong H Jeong
 * Desc: Reset login information
 * History
 *  - 07/01/2023 Initial version created
 *
 * Reference:
 */

function UpdateInfo(OPWD, NPWD)
{
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
                case "0x00201000":
                    Swal.fire({
                        title: "ERROR",
                        text: "Current password does not match!",
                        icon: "error"
                    }).then(function(){
                        passwordchange(OPWD, NPWD);
                    });
                    break;
                case "0x11111111": {
                    Swal.fire({
                        title: "Updated!",
                        html: "Password has been updated successfully!! Please log-in again!!",
                        icon: "success"
                    }).then(function(){
                        location.href="index.php";
                    });
                }
                    break;
                default:
                    Swal.fire({title:"ERROR", text: "Unexpected error found. Please contact the system administrator!", icon:"error"});
            }
        }
    }
    let param = "email=<?php if (isset($_SESSION['IETD_USERIDX'])) echo($_SESSION['IETD_USERIDX']);?>&_OPWD="+encodeURIComponent(OPWD)+"&_NPWD="+encodeURIComponent(NPWD);
    xmlhttp.open("POST", "changelogininfo_save.php", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send(param);
}


function CheckValidation()
{
    if (passwordchagnefrm.oldpassword.value == "")
    {
        passwordchagnefrm.oldpassword.focus();
        Swal.fire({title:"ERROR", html:"<h5>Current password is not entered!!</h5>", icon:"error"});
        return false;
    }
    else if (passwordchagnefrm.newpassword.value == "")
    {
        passwordchagnefrm.newpassword.focus();
        Swal.fire({title:"ERROR", html:"<h5>New password is not entered!!</h5>", icon:"error"});
        return false;
    }
    else if (passwordchagnefrm.newpasswordagain.value == "")
    {
        passwordchagnefrm.newpasswordagain.focus();
        Swal.fire({title:"ERROR", html:"<h5>Re-enter new password!!</h5>", icon:"error"});
        return false;
    }
    else if (passwordchagnefrm.newpassword.value != passwordchagnefrm.newpasswordagain.value)
    {
        passwordchagnefrm.newpasswordagain.focus();
        Swal.fire({title:"ERROR", html:"<h5>New password and re-entered password does not match!!</h5>", icon:"error"});
        return false;
    }
    return true;
}

function passwordchange(oldpassword='', newpassword='')
{
    const content = ''
        + '<form name=passwordchagnefrm id=passwordchagnefrm>'
        + '<table style="width:100%; font-size:10pt;">'
        + '<tr style="height:25px;"><td align="right"><span style="color:red;">*</span>YOUR&nbsp;CURRENT&nbsp;PASSWORD:&nbsp;</td><td align="left"><input id="oldpassword" name="oldpassword" value="'+oldpassword+'" type="password" readonly onfocus="this.removeAttribute(\'readonly\');" placeholder="password" autocomplete="off" style="width:250px;font-size:10pt;border-style:solid;border-width:1px;"></td></tr>'
        + '<tr style="height:25px;"><td align="right"><span style="color:red;">*</span>CHOOSE&nbsp;A&nbsp;NEW&nbsp;PASSWORD::&nbsp;</td><td align="left"><input id="newpassword" name="newpassword" value="'+newpassword+'" type="password" readonly onfocus="this.removeAttribute(\'readonly\');" placeholder="newpassword" style="width:250px;font-size:10pt;border-style:solid;border-width:1px;"></td></tr>'
        + '<tr style="height:25px;"><td align="right"><span style="color:red;">*</span>RE-ENTER&nbsp;NEW&nbsp;PASSWORD::&nbsp;</td><td align="left"><input id="newpasswordagain" name="newpasswordagain" value="'+newpassword+'" type="password" readonly onfocus="this.removeAttribute(\'readonly\');" placeholder="newpasswordagain" style="width:250px;font-size:10pt;border-style:solid;border-width:1px;"></td></tr>'
        //				+ '<tr><td colspan="2" align="right"><button onclick="CheckValidation();return false;">UPDATE</button>&nbsp;<button class="cancel" onclick="popupWin();return false;">CANCEL</button></div>'
        + '</table></form>';

    Swal.fire({
        title: '<i class="fas fa-cogs"></i>&nbsp;<span style="font-size:16pt;font-weight: bold;">CHANGE PASSWORD</span>',
        html: content,
        // icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Change Now'
    }).then((result) => {
        if (result.isConfirmed) {
            if (CheckValidation() == false)
                return false;

            UpdateInfo(passwordchagnefrm.oldpassword.value, passwordchagnefrm.newpassword.value);
            return true; // close bootbox
        }
    })

    return;

    let bbxdialog = bootbox.dialog({
        title: '<i class="fas fa-cogs fa-sm fa-fw mr-2 text-gray-400"></i>&nbsp;<span style="font-size:16pt;font-weight: bold;">CHANGE PASSWORD</span>',
        message: content,
        onEscape: true,
        buttons: {
            ok: {
                label: "<i class=\"fas fa-check\"></i>&nbsp;CHANGE",
                className: 'btn-success',
                id: "ok-button-id",
                callback: function(){
                    if (CheckValidation() == false)
                        return false;

                    UpdateInfo(passwordchagnefrm.oldpassword.value, passwordchagnefrm.newpassword.value);
                    return true; // close bootbox
                }
            },
            cancel: {
                label: "<i class=\"fas fa-times\"></i>&nbsp;CANCEL",
                className: 'btn-default',
                callback: function(){
                }
            }
        }
    }).on('shown.bs.modal',function(){
        $("#oldpassword").focus();
    }).find('.modal-content').css({
        'margin-top': function (){
            const w = $( window ).height();
            const b = $(this).height();
            let h = (w-b)*0.33;
            return h+"px";
        }
    });
}
