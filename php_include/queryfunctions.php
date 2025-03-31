<?php 
require_once ('notify_user.php');
require_once ('dbconnection_config.php');

class Query_Functions
{
	var $err_message;
	var $DB_hostname,$DB_userid,$DB_userpwd,$DB_dbname;

   function __construct($hostname,$userid,$userpwd,$dbname) {
		$this->vHostname = $hostname;
		$this->vDbname = $dbname;
		$this->vUserid = $userid;
		$this->vUserpwd = $userpwd;
   }

	function Query_ManualCommit($query)
	{
		try {
			$conn = new mysqli($this->vHostname,$this->vUserid,$this->vUserpwd,$this->vDbname); // error-check this
			// check connection
			if (mysqli_connect_errno()) {
				throw new Exception('Connect failed: '. mysqli_connect_error());
			}

			$conn->autocommit(FALSE); // i.e., start transaction

			$result = $conn->multi_query($query);
			if ( !$result ) {
				throw new Exception($conn->error);
			}
	//		mysqli_free_result($result);

			$conn->commit();
			$conn->autocommit(TRUE); // i.e., end transaction

			$this->err_message = "0x11111111";
			return $this->err_message;
		}
		catch ( Exception $e ) {

			// before rolling back the transaction, you'd want
			// to make sure that the exception was db-related
			$conn->rollback(); 
			$conn->autocommit(TRUE); // i.e., end transaction

			Notify_Admin("SQL ERROR<br\><br\>Query: ".$query."<br\><br\>ERR MESSAGE: ".$e."<br/>User: ".$_SESSION['IETD_USERNAME']);
	//		echo $query;
	//		echo ($e);
			$this->err_message = "0x00000012";
			return $this->err_message;
		}
		$conn->close();         // close the connection
	}

	function GetErrMessage()
	{
		return $this->err_message;
	}
}

?>