<?php

require_once ('dbconnection_class.php');
function getSqlConnAttributes()
{
    if (!isset($SQL_CONNATTRIBUTES)) {
        require_once('config.php');
        // SQL server connection information
        $SQL_CONNATTRIBUTES = array(
            'type' => 'sqlite',  // or 'mysql'
            'user' => __DB_USERID,
            'pass' => __DB_USERPWD,
            'db' => __DB_DBNAME,
            'host' => __DB_HOSTNAME
        );
    }
    return $SQL_CONNATTRIBUTES;
}
