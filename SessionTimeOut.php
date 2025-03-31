<?php
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
