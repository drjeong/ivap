<?php

//define('__DB_DBNAME', '../../precipitationdb.sqlite3');

require_once(dirname(__FILE__).'/dbconnection_class.php');
$dbConnection = new Dbconnection;

function convertStringNullToNull($dbConnection, $tableName) {
    // Query to get column names of the table
    $query = "PRAGMA table_info(`$tableName`)";
    $columns = $dbConnection->prepareExecute($query, [], true); // Execute query using your prepareExecute method
//    print_r($columns);

    // Iterate over each column and update the ones with 'NULL' string
    foreach ($columns as $column) {
        $columnName = $column['name'];  // Get the column name from the result

        // Update the column where 'NULL' string is found
        $updateQuery = "UPDATE $tableName SET $columnName = NULL WHERE $columnName = 'NULL'";
        $dbConnection->prepareExecute($updateQuery);  // Execute the update query
//        echo $updateQuery;
    }
    echo "Done";
}

function checkTableExists($dbConnection, $tableName) {
    // Ensure proper case handling with quotes
    $query = "SELECT name FROM sqlite_master WHERE type='table' AND name='$tableName'";
    echo ($query . PHP_EOL);

    $stmt = $dbConnection->prepare($query);
    $stmt->execute();

    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($result)) {
        echo "Table '$tableName' does not exist in the database.";
    } else {
        echo "Table '$tableName' found.";
    }
}

echo (__DB_DBNAME);


// Example usage:
$tableName = 'newweatherstations';
checkTableExists($dbConnection, $tableName);
convertStringNullToNull($dbConnection, $tableName);




