<?php 
// Upload Transcript
require_once (dirname(__FILE__) . '/php_include/config.php');

require_once 'SessionTimeOut.php';

if(!isset($_SESSION['IETD_USERIDX']) || SessionTimeOut())
{
    session_unset();
    session_destroy();
    session_write_close();
    session_start();
    session_regenerate_id(true);

    echo <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="5;url=./index.php">
    <style>
        .alert {
            background-color: white;
            font-family: 'Open Sans', sans-serif;
            width: 478px;
            padding: 17px;
            border-radius: 5px;
            text-align: center;
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            overflow: hidden;
        }
        h2 {
            color: #575757;
            font-size: 30px;
            text-align: center;
            font-weight: 600;
            text-transform: none;
            margin: 25px 0;
            line-height: 25px;
        }
        p {
            color: #797979;
            font-size: 16px;
            text-align: center;
            font-weight: 300;
            margin: 0;
        }
        button {
            background-color: #AEDEF4;
            color: white;
            border: none;
            font-size: 17px;
            font-weight: 500;
            border-radius: 5px;
            padding: 10px 32px;
            margin: 26px 5px 0 5px;
            cursor: pointer;
        }
        button:hover {
            background-color: #a1d9f2;
        }
        button:active {
            background-color: #81ccee;
        }
    </style>
</head>
<body style="background-color: gray;">
    <div class="alert">
        <img src="./images/msg_error.jpg" width="100" alt="Error Icon">
        <h2>Warning!!</h2>
        <p>Session finished, you will be redirected in 5 seconds.</p>
        <button onclick="window.location.assign('./index.php');">OK</button>
    </div>
</body>
</html>
HTML;


    exit;
}

// update session time
$_SESSION['IETD_LOGGEDAT']= time();// update last accessed time

