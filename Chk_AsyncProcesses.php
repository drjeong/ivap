<?php 
if (session_status() === PHP_SESSION_NONE) { session_start(); }

$async_process = shell_exec('ps -C php -o args h');
if ($async_process != "")
{
	if (strpos($async_process, 'upload') >= 0)
	{
		$_SESSION['file_uploading'] = true;
		echo ("0x10001029"); // uploading is in progress
	}
}
else 
{
	if (isset($_SESSION['file_uploading']))
	{
		if ($_SESSION['file_uploading'] == true)
		{
			echo ("0x10001011"); // uploading is completed
			$_SESSION['file_uploading'] = false;
			unset($_SESSION['file_uploading']);
		}
	}
}
