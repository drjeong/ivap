<?php

/*
 * Helper functions for building a DataTables server-side processing SQL query
 *
 * The static functions in this class are just helper functions to help build
 * the SQL used in the DataTables demo server-side processing scripts. These
 * functions obviously do not represent all that can be done with server-side
 * processing, they are intentionally simple to show how it works. More complex
 * server-side processing operations will likely require a custom script.
 *
 * See http://datatables.net/usage/server-side for full details on the server-
 * side processing requirements of DataTables.
 *
 * @license MIT - http://datatables.net/license_mit
 */

class SSP {
    static $dbtype = null;
    static $dbuser = null;
    static $dbuser_pass = null;
    static $dbName = null;
    static $dbhost = null;

    /**
     * Create the data output array for the DataTables rows
     *
     * @param array $columns Column information array
     * @param array $data    Data from the SQL get
     * @param bool  $isJoin  Determine the JOIN/complex query or simple one
     *
     * @return array Formatted data in a row based format
     */

    static function data_output ( $columns, $data, $isJoin = false )
    {
        $out = array();

        for ( $i=0, $ien=count($data) ; $i<$ien ; $i++ ) {
            $row = array();

            for ( $j=0, $jen=count($columns) ; $j<$jen ; $j++ ) {
                $column = $columns[$j];

                // Is there a formatter?
                if ( isset( $column['formatter'] ) ) {
					if (isset($column['dt']) && isset($column['field']))
	                    $row[ $column['dt'] ] = ($isJoin) ? $column['formatter']( $data[$i][ $column['field'] ], $data[$i] ) : $column['formatter']( $data[$i][ $column['db'] ], $data[$i] );
                }
                else {
                    $row[ $column['dt'] ] = ($isJoin) ? $data[$i][ $columns[$j]['field'] ] : $data[$i][ $columns[$j]['db'] ];
                }
            }

            $out[] = $row;
        }

        return $out;
    }


    /**
     * Paging
     *
     * Construct the LIMIT clause for server-side processing SQL query
     *
     *  @param  array $request Data sent to server by DataTables
     *  @param  array $columns Column information array
     *  @return string SQL limit clause
     */
    static function limit ( $request, $columns )
    {
        $limit = '';

        if ( isset($request['start']) && $request['length'] != -1 ) {
            $limit = "LIMIT ".intval($request['start']).", ".intval($request['length']);
        }

        return $limit;
    }

    /**
     * Format identifier (table name, column name) according to DB type
     *
     * @param string $identifier The identifier to format
     * @param string $db_type Database type
     * @return string Formatted identifier
     */
    static function format_identifier($identifier, $db_type) {
        return $db_type === 'mysql' ? "`$identifier`" : "\"$identifier\"";
    }

    static function order($request, $columns, $isJoin = false) {
        $order = '';
        $db_type = self::$dbtype;

        if (isset($request['order']) && count($request['order'])) {
            $orderBy = array();
            $dtColumns = self::pluck($columns, 'dt');

            for ($i = 0, $ien = count($request['order']); $i < $ien; $i++) {
                $columnIdx = intval($request['order'][$i]['column']);
                $requestColumn = $request['columns'][$columnIdx];

                $columnIdx = array_search($requestColumn['data'], $dtColumns);
                $column = $columns[$columnIdx];

                if ($requestColumn['orderable'] == 'true') {
                    $dir = $request['order'][$i]['dir'] === 'asc' ? 'ASC' : 'DESC';

                    if ($isJoin) {
                        $orderBy[] = $column['db'] . ' ' . $dir;
                    } else {
                        $orderBy[] = self::format_identifier($column['db'], $db_type) . ' ' . $dir;
                    }
                }
            }

            $order = 'ORDER BY ' . implode(', ', $orderBy);
        }

        return $order;
    }

    static function filter($request, $columns, &$bindings, $isJoin = false) {
        $globalSearch = array();
        $columnSearch = array();
        $dtColumns = self::pluck($columns, 'dt');
        $db_type = self::$dbtype;

        if (isset($request['search']) && $request['search']['value'] != '') {
            $str = $request['search']['value'];

            for ($i = 0, $ien = count($request['columns']); $i < $ien; $i++) {
                $requestColumn = $request['columns'][$i];
                $columnIdx = array_search($requestColumn['data'], $dtColumns);
                $column = $columns[$columnIdx];

                if ($requestColumn['searchable'] == 'true') {
                    $binding = self::bind($bindings, '%' . $str . '%', PDO::PARAM_STR);
                    if ($isJoin) {
                        $globalSearch[] = $column['db'] . " LIKE " . $binding;
                    } else {
                        $globalSearch[] = self::format_identifier($column['db'], $db_type) . " LIKE " . $binding;
                    }
                }
            }
        }


        // Individual column filtering
        if (isset($request['columns'])) {
            for ( $i=0, $ien=count($request['columns']) ; $i<$ien ; $i++ ) {
                $requestColumn = $request['columns'][$i];
                $columnIdx = array_search( $requestColumn['data'], $dtColumns );
                $column = $columns[ $columnIdx ];

                $str = $requestColumn['search']['value'];

                if ( $requestColumn['searchable'] == 'true' &&
                    $str != '' ) {
                    $binding = SSP::bind( $bindings, '%'.$str.'%', PDO::PARAM_STR );
                    $columnSearch[] = ($isJoin) ? $column['db']." LIKE ".$binding : "`".$column['db']."` LIKE ".$binding;
                }
            }
        }

        // Combine the filters into a single string
        $where = '';

        if ( count( $globalSearch ) ) {
            $where = '('.implode(' OR ', $globalSearch).')';
        }

        if ( count( $columnSearch ) ) {
            $where = $where === '' ?
                implode(' AND ', $columnSearch) :
                $where .' AND '. implode(' AND ', $columnSearch);
        }

        if ( $where !== '' ) {
            $where = 'WHERE '.$where;
        }

        return $where;
    }

    static function sql_connect($sql_details) {
        try {
            self::$dbtype = $sql_details['type'];
            self::$dbuser = $sql_details['user'];
            self::$dbuser_pass = $sql_details['pass'];
            self::$dbName = $sql_details['db'];
            self::$dbhost = $sql_details['host'];

            if (self::$dbtype === 'sqlite') {
                $db = new PDO(
                    "sqlite:{$sql_details['db']}",
                    null,
                    null,
                    array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION)
                );
            } else {
                $db = new PDO(
                    "mysql:host={$sql_details['host']};dbname={$sql_details['db']}",
                    $sql_details['user'],
                    $sql_details['pass'],
                    array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION)
                );
                $db->query("SET NAMES 'utf8'");
            }
        } catch (PDOException $e) {
            self::fatal(
                "An error occurred while connecting to the database. " .
                "The error reported by the server was: " . $e->getMessage()
            );
        }

        return $db;
    }

    static function joinquery($request, $sql_details, $table, $primaryKey, $columns, $joinQuery = '', $extraWhere = '', $groupBy = '', $printquery = false) {
        $bindings = array();
        $db = self::sql_connect($sql_details);
        $db_type = self::$dbtype;

        $limit = self::limit($request, $columns);
        $order = self::order($request, $columns, $joinQuery);
        $where = self::filter($request, $columns, $bindings, $joinQuery);

        if ($extraWhere != "")
            $extraWhere = ($where) ? ' AND ' . $extraWhere : ' WHERE ' . $extraWhere;

        if ($groupBy != "")
            $groupBy = ($groupBy) ? ' GROUP BY ' . $groupBy . ' ' : '';

        if ($joinQuery != "") {
            $col = self::pluck($columns, 'db', $joinQuery);
            if ($db_type === 'mysql') {
                $query = "SELECT SQL_CALC_FOUND_ROWS " . implode(", ", $col);
            } else {
                $query = "SELECT " . implode(", ", $col);
            }
            $query .= " $joinQuery $where $extraWhere $groupBy $order $limit";
        } else {
            $fields = implode(', ', array_map(function($field) use ($db_type) {
                return self::format_identifier($field, $db_type);
            }, self::pluck($columns, 'db')));

            if ($db_type === 'mysql') {
                $query = "SELECT SQL_CALC_FOUND_ROWS $fields";
            } else {
                $query = "SELECT $fields";
            }
            $query .= " FROM " . self::format_identifier($table, $db_type);
            $query .= " $where $extraWhere $groupBy $order $limit";
        }

        if ($printquery) {
            $tmp = preg_replace("/\s+/", " ", $query);
            $tmp = stripslashes($tmp);
            echo($tmp);
        }

        $data = self::sql_exec($db, $bindings, $query);

        // Handle record counting differently for SQLite and MySQL
        if ($db_type === 'mysql') {
            $resFilterLength = self::sql_exec($db, "SELECT FOUND_ROWS()");
            $recordsFiltered = $resFilterLength[0][0];
        } else {
            // For SQLite, we need to do a COUNT(*) with the same WHERE clause
            $queryCount = "SELECT COUNT(*) FROM " . self::format_identifier($table, $db_type);
            if ($where) {
                $queryCount .= " $where";
            }
            if ($extraWhere) {
                $queryCount .= " $extraWhere";
            }
            $resFilterLength = self::sql_exec($db, $bindings, $queryCount);
            $recordsFiltered = $resFilterLength[0][0];
        }

        // Total data set length
        if ($joinQuery != "") {
            $resTotalLength = self::sql_exec($db,
                "SELECT COUNT({$primaryKey}) $joinQuery"
            );
        } else {
            $resTotalLength = self::sql_exec($db,
                "SELECT COUNT(" . self::format_identifier($primaryKey, $db_type) . ") " .
                "FROM " . self::format_identifier($table, $db_type)
            );
        }
        $recordsTotal = $resTotalLength[0][0];

        $draw = isset($request['draw']) ? $request['draw'] : '';

        return array(
            "draw" => intval($draw),
            "recordsTotal" => intval($recordsTotal),
            "recordsFiltered" => intval($recordsFiltered),
            "data" => self::data_output($columns, $data, $joinQuery)
        );
    }

    /**
     * Execute an SQL query on the database
     *
     * @param  resource $db  Database handler
     * @param  array    $bindings Array of PDO binding values from bind() to be
     *   used for safely escaping strings. Note that this can be given as the
     *   SQL query string if no bindings are required.
     * @param  string   $sql SQL query to execute.
     * @return array         Result from the query (all rows)
     */
    static function sql_exec ( $db, $bindings, $sql=null )
    {
        // Argument shifting
        if ( $sql === null ) {
            $sql = $bindings;
        }

//        echo $sql;
        $stmt = $db->prepare( $sql );

        // Bind parameters
        if ( is_array( $bindings ) ) {
            for ( $i=0, $ien=count($bindings) ; $i<$ien ; $i++ ) {
                $binding = $bindings[$i];
                $stmt->bindValue( $binding['key'], $binding['val'], $binding['type'] );
            }
        }

        // Execute
        try {
            $stmt->execute();
        }
        catch (PDOException $e) {
            SSP::fatal( "An SQL error occurred: ".$e->getMessage() );
        }

        // Return all
        return $stmt->fetchAll();
    }


    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * Internal methods
     */

    /**
     * Throw a fatal error.
     *
     * This writes out an error message in a JSON string which DataTables will
     * see and show to the user in the browser.
     *
     * @param  string $msg Message to send to the client
     */
    static function fatal ( $msg )
    {
        echo json_encode( array(
            "error" => $msg
        ) );

        exit(0);
    }

    /**
     * Create a PDO binding key which can be used for escaping variables safely
     * when executing a query with sql_exec()
     *
     * @param  array &$a    Array of bindings
     * @param  *      $val  Value to bind
     * @param  int    $type PDO field type
     * @return string       Bound key to be used in the SQL where this parameter
     *   would be used.
     */
    static function bind ( &$a, $val, $type )
    {
        $key = ':binding_'.count( $a );

        $a[] = array(
            'key' => $key,
            'val' => $val,
            'type' => $type
        );

        return $key;
    }


    /**
     * Pull a particular property from each assoc. array in a numeric array,
     * returning and array of the property values from each item.
     *
     *  @param  array  $a    Array to get data from
     *  @param  string $prop Property to read
     *  @param  bool  $isJoin  Determine the JOIN/complex query or simple one
     *  @return array        Array of property values
     */
    static function pluck ( $a, $prop, $isJoin = false )
    {
        $out = array();

        for ( $i=0, $len=count($a) ; $i<$len ; $i++ ) {
            $out[] = ($isJoin && isset($a[$i]['as'])) ? $a[$i][$prop]. ' AS '.$a[$i]['as'] : $a[$i][$prop];
        }

        return $out;
    }
}
