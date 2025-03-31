<?php
// https://dev.mysql.com/doc/apis-php/en/apis-php-mysqli.real-escape-string.html
require_once ('notify_user.php');

class Dbconnection
{
    var $SendSQLError = false;
    var $vDbname;        // Database name
    var $vError_Msg;     // error message
    var $vDbconnect = null;  // Connection variable
    var $vDbstatus;      // Database status
    var $vDbtable;       // Database table
    var $vUserid;        // Database user id (for MySQL)
    var $vUserpwd;       // Database user pwd (for MySQL)
    var $vHostname;      // Database Host name (for MySQL)
    var $vResult;        // Query result
    var $vQuery;
    var $dbType;         // Database type: 'mysql' or 'sqlite'

    function __construct()
    {
        require('config.php');
        $this->vHostname = __DB_HOSTNAME;
        $this->vDbname = __DB_DBNAME;
        $this->vUserid = __DB_USERID;
        $this->vUserpwd = __DB_USERPWD;
        $this->dbType = __DB_TYPE;  // MySQL or SQLite
        $this->vResult = null;
        $this->dbConnect();
    }

    function __destruct()
    {
        $this->dbClose();
    }

    // Escape string based on DB type
    function realEscapeString($item)
    {
        if ($this->dbType == 'mysql') {
            return mysqli_real_escape_string($this->vDbconnect, $item);
        } elseif ($this->dbType == 'sqlite') {
            return $this->vDbconnect->quote($item);  // SQLite uses quote method for escaping
        }
        return $item;
    }

    // Database connection (supports MySQL and SQLite)
    function dbConnect()
    {
        if ($this->dbType == 'mysql') {
            $this->vDbconnect = new mysqli($this->vHostname, $this->vUserid, $this->vUserpwd, $this->vDbname) or die($this->Fquery_error());
        } elseif ($this->dbType == 'sqlite') {
            $this->vDbconnect = new PDO('sqlite:' . $this->vDbname) or die($this->Fquery_error());
            $this->vDbconnect->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);  // Enable PDO error mode
        }
    }

    function prepare($query) {
        if ($this->vDbconnect == null) {
            return null;
        }

        // For MySQL and SQLite, PDO is used for prepared statements
        if ($this->dbType === 'mysql' || $this->dbType === 'sqlite') {
            try {
                // Prepare the query using PDO's prepare method
                $stmt = $this->vDbconnect->prepare($query);

                // Check if the preparation is successful
                if (!$stmt) {
                    $this->query_error(); // Handle query error (you can customize this)
                    return null;
                }
                return $stmt;
            } catch (PDOException $e) {
                // Handle any errors with PDO preparation
                echo "PDO Error: " . $e->getMessage();
                return null;
            }
        }

        return null; // Return null if dbType is not MySQL or SQLite
    }


    function prepareExecute($query, $params = [], $show=false)
    {
        if ($this->vDbconnect == null) return null;

        $this->freeResult(); // free result first

        // MySQL
        if ($this->dbType === 'mysql') {
            $stmt = $this->vDbconnect->prepare($query);
            if (!$stmt) {
                $this->queryError();
                return null;
            }

            if (!empty($params)) {
                $types = '';
                $bindParams = [];
                foreach ($params as $param) {
                    if (is_int($param)) {
                        $types .= 'i';
                    } elseif (is_float($param)) {
                        $types .= 'd';
                    } elseif (is_string($param)) {
                        $types .= 's';
                    } else {
                        $types .= 'b';
                    }
                    $bindParams[] = $param;
                }
                array_unshift($bindParams, $types);
                call_user_func_array([$stmt, 'bind_param'], $this->refValues($bindParams));
            }

            if ($show) {
                // Print the query with the bound parameters for MySQL
                $bindedQuery = $query;
                foreach ($params as $param) {
                    $bindedQuery = preg_replace('/\?/', $this->real_escape_string($param), $bindedQuery, 1);
                }
                echo "Prepared Query: " . $bindedQuery . "<br />";
                error_log("Prepared Query: " . $bindedQuery);
            }

            $executed = $stmt->execute();
            if (!$executed) {
                $this->queryError();
                return null;
            }

            $this->vResult = $stmt->get_result(); // MySQL result set
            $data = [];
            while ($row = $this->vResult->fetch_assoc()) {
                $data[] = $row;
            }
            return $data;
        }

        // SQLite
        elseif ($this->dbType === 'sqlite') {
            $stmt = $this->vDbconnect->prepare($query);
            if (!$stmt) {
                $this->queryError();
                return null;
            }

            foreach ($params as $key => $param) {
                $stmt->bindValue($key + 1, $param);
            }

            if ($show) {
                // Print the query with bound parameters for SQLite
                $bindedQuery = $query;
                foreach ($params as $param) {
                    $bindedQuery = preg_replace('/\?/', $this->realEscapeString($param), $bindedQuery, 1);
                }
                echo "Prepared Query: " . $bindedQuery . "<br />";
            }

            $executed = $stmt->execute();
            if (!$executed) {
                $this->queryError();
                return null;
            }

            $this->vResult = $stmt->fetchAll(PDO::FETCH_ASSOC); // SQLite result set
            return $this->vResult;
        }

        return null; // If no valid dbType
    }


    // Send query to database (supports both MySQL and SQLite)
    function sendQuery($query)
    {
        $this->freeResult(); // free result first

        $this->vQuery = $query;
        if ($this->dbType == 'mysql') {
            $this->vResult = mysqli_query($this->vDbconnect, $query) or die($this->Fquery_error());
        } elseif ($this->dbType == 'sqlite') {
            $this->vResult = $this->vDbconnect->query($query) or die($this->Fquery_error());
        }
        return $this->vResult;
    }

    // Send multiple queries (MySQL only supports multi-query)
    function sendMultiqueries($query)
    {
        $this->freeResult(); // free result first

        $this->vQuery = $query;
        if ($this->dbType == 'mysql') {
            $this->vResult = mysqli_multi_query($this->vDbconnect, $query) or die($this->Fquery_error());

            // Process multiple queries
            while (mysqli_next_result($this->vDbconnect)) {
                $this->vResult = mysqli_next_result($this->vDbconnect);
                if (!$this->vResult && mysqli_errno($this->vDbconnect) != 0) $this->queryError();

                // Free result
                $discard = mysqli_store_result($this->vDbconnect);
            }
        } elseif ($this->dbType == 'sqlite') {
            // SQLite does not support multi-query in the same way as MySQL.
            $this->vResult = $this->vDbconnect->exec($query) or die($this->Fquery_error());
        }
    }

    // Get total row count
    function getTotalCount($query)
    {
        $this->vQuery = $query;
        if ($this->dbType == 'mysql') {
            $this->vResult = mysqli_query($this->vDbconnect, $query) or die($this->Fquery_error());
            return mysqli_num_rows($this->vResult);
        } elseif ($this->dbType == 'sqlite') {
            $this->vResult = $this->vDbconnect->query($query) or die($this->Fquery_error());
            return $this->vResult->rowCount();
        }
        return 0;
    }

    // Free result (for MySQL and SQLite)
    function freeResult()
    {
        if ($this->dbType == 'mysql') {
            // MySQL-specific code for freeing result
            do {
                if ($res = $this->vDbconnect->store_result()) {
                    $res->fetch_all(MYSQLI_ASSOC);
                    $res->free();
                }
            } while ($this->vDbconnect->more_results() && $this->vDbconnect->next_result());
        } elseif ($this->dbType == 'sqlite') {
            // SQLite-specific code for freeing result
            if ($this->vResult && $this->vResult instanceof PDOStatement) {
                $this->vResult->closeCursor(); // Close the cursor for PDOStatement
            }
        }
    }


    // Fetch associative result (for MySQL and SQLite)
    function fetchAssoc()
    {
        if ($this->vResult == null || $this->vResult == false) {
            return false;  // Return false for no result
        }

        if ($this->dbType == 'mysql') {
            // For MySQL, fetch a single row as an associative array
            return mysqli_fetch_assoc($this->vResult);
        } elseif ($this->dbType == 'sqlite') {
            // For SQLite, check if vResult is a PDOStatement before calling fetch
            if ($this->vResult instanceof PDOStatement) {
                return $this->vResult->fetch(PDO::FETCH_ASSOC);
            } else {
                return false; // If it's not a PDOStatement, return false
            }
        }

        return null;
    }


    // Get last error message
    function getError()
    {
        if ($this->dbType == 'mysql') {
            return mysqli_error($this->vDbconnect);
        } elseif ($this->dbType == 'sqlite') {
            return $this->vDbconnect->errorInfo()[2];
        }
        return '';
    }

    // Handle query errors
    function queryError()
    {
        $LoginUserName = '';
        if (isset($_SESSION['LOGIN_USERNAME'])) $LoginUserName = $_SESSION['LOGIN_USERNAME'];

        if ($this->vDbconnect)
        {
            echo ("SQL ERROR<br/><br/>Query: ".$this->vQuery."<br/><br/>ERR MESSAGE: ". $this->Fgeterror());
            Notify_Admin("SQL ERROR<br/><br/>Query: ".$this->vQuery."<br/><br/>ERR MESSAGE: ".mysqli_errno ($this->vDbconnect) . " " . mysqli_error($this->vDbconnect));
        }
        else
        {
            echo ("Failed to connect to the database.");
            Notify_Admin("Failed to connect to MySQL: (" . mysqli_connect_errno() . ") " );
        }
        exit;
    }

    // Close database connection
    function dbClose()
    {
        if ($this->vDbconnect != null) {
            if ($this->dbType == 'mysql') {
                mysqli_close($this->vDbconnect);
            } elseif ($this->dbType == 'sqlite') {
                $this->vDbconnect = null;  // PDO object will automatically close the connection when set to null
            }
        }
    }
}
