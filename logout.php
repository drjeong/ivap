<?php 
session_start();
if(!isset($_SESSION['IETD_USERIDX']))
{
	echo ("<meta http-equiv='Refresh' content='1;url=./'>"); 
	exit;
}

session_destroy(); 

	echo ("<!DOCTYPE html> <html> <head> <style> .alert{background-color: white; font-family: 'Open Sans', sans-serif; width: 478px; padding: 17px; border-radius: 5px; text-align: center; position: fixed; left: 50%; top: 50%; margin-left: -256px; margin-top: -200px; overflow: hidden;} h2{color:#575757;font-size:30px;text-align:center;font-weight:600;text-transform:none;position:relative;margin:25px 0;padding:0;line-height:25px;display:block; } p{color:#797979;font-size:16px;text-align:center;font-weight:300;position:relative;margin:0;padding:0;line-height:normal; } button { background-color:#AEDEF4; color:white; border:none; box-shadow:none; font-size:17px; font-weight:500; border-radius:5px; padding:10px 32px; margin:26px 5px 0 5px; cursor:pointer; } button:focus { outline:none; box-shadow:0 0 2px rgba(128, 179, 235, 0.5), inset 0 0 0 1px rgba(0, 0, 0, 0.05); } button:hover { background-color:#a1d9f2; } button:active { background-color:#81ccee; } </style> </head> <body style='background-color:gray'> <div class='alert'> <br/><br/> <img src='./images/msg_success.jpg' width='100'><br/> <h2>LOG OUT</h2> <p>Successfully logged out!!</p></div></body> </html>");
	echo ("<meta http-equiv='Refresh' content='1;url=./'>");
?>