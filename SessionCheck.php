<?php
// called from sessionexpire.js
if (session_status() === PHP_SESSION_NONE) { session_start(); }
echo(SessionCheck());

function SessionCheck()
{
	if(!isset($_SESSION['IETD_USERIDX']) || SessionTimeOut())
	{
		session_unset();
		return true;
	}
	return false;
}

function SessionTimeOut()
{
	if(!isset($_SESSION['IETD_LOGGEDAT'])) return false; // session not defined

	$current = time();// take the current time
	$diff = $current - $_SESSION['IETD_LOGGEDAT'];
	if($diff > $_SESSION['IETD_TIMEOUT'])
	{
		return true;
	}
	return false;
}