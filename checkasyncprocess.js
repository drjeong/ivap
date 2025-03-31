/**
 * Title: Checking Async Process
 * File: checkasyncprocess.js
 * Author: Dong H Jeong
 * Desc: Checking internal process
 * History
 *  - 07/01/2023 Initial version created
 *
 * Reference:
 */

function CheckAsyncProcesses()
{
    if (window.XMLHttpRequest) {
    // code for IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp=new XMLHttpRequest();
    } else { // code for IE6, IE5
        xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange=function() {
        if (xmlhttp.readyState==4 && xmlhttp.status==200) {
            if (xmlhttp.responseText != "") {
                switch(xmlhttp.responseText.trim())
                {
                    case "0x10001029": {
                        let div = document.getElementById('data_uploading_notice');
                        div.style.visibility = 'visible';
                        div.style.display = 'block';

                        setTimeout(CheckAsyncProcesses, 30000);
                    }
                    break;
                    case "0x10001011": {
                        let div = document.getElementById('data_uploading_notice');
                        div.style.visibility = 'hidden';
                        div.style.display = 'none';

                        Swal.fire({
                            title: "Success!",
                            text: "Data uploading has completed!!",
                            icon: "success",
                            timer: 3000
                        });
                    }
                    break;
                }
            }
        }
    }
    xmlhttp.open("GET","Chk_AsyncProcesses.php",true);
    xmlhttp.send();
}

// CheckAsyncProcesses();
