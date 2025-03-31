<?php 
// Upload Transcript
//require_once('sessionchecker.php');

include_once ('./php_include/dbconnection_class.php');
$dbConnection = new Dbconnection; // DB CONNECTION

function left_reference(&$str, $length) {
	if (strlen($str) < $length) $length = strlen($str);
	$leftval = substr($str, 0, $length);
	$str = right($str, strlen($str)-$length);
	return $leftval;
}
function left($str, $length) {
	 return substr($str, 0, $length);
}
function right($str, $length) {
	 return substr($str, -$length);
}

function CreateTable($TableName, $fields)
{
	$query = "CREATE TABLE IF NOT EXISTS `".$TableName."` (`Idx` bigint(20) NOT NULL AUTO_INCREMENT, ";

	for($i = 1; $i <= count($fields); $i++)
	{
		$query .= "`Field".$i."` varchar(".strlen($fields[$i-1]).") DEFAULT NULL, ";
	}
	$query .= "`ISD` bigint(20) NOT NULL, PRIMARY KEY (`Idx`), KEY `ISD` (`ISD`), CONSTRAINT `".$TableName."_ibfk_1` FOREIGN KEY (`ISD`) REFERENCES `INTEGRATED_SURFACE_DATA` (`Idx`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB  DEFAULT CHARSET=latin1;";
//	echo "</br>".$query."</br>";
	$GLOBALS['DBCONNECTION']->sendQuery($query);
}

function InsertToTable($TableName, $fields, $Idx)
{
	$query = "INSERT INTO `$TableName` ( ";
	for($i = 1; $i <= count($fields); $i++)
	{
		$query .= "`Field".$i."`, ";
	}
	$query .= "`ISD`) VALUES (";
	
	for($i = 1; $i <= count($fields); $i++)
	{
		if ($fields[$i-1]=='NULL')
		{
			$query .= "NULL, ";
		}
		else
		{
			$data = htmlspecialchars ($fields[$i-1]);
			$query .= "'".$data."', ";
		}
	}
	$query .= "'$Idx') ;";
//	echo "</br>".$query."</br>";

	$GLOBALS['DBCONNECTION']->sendQuery($query);
}

function UploadDataProcess($filename)
{
	$TOTAL_VARIABLE_CHARACTERS='';
	$FIXED_WEATHER_STATION_USAF_MASTER_STATION_CATALOG_identifier='';
	$FIXED_WEATHER_STATION_NCEI_WBAN_identifier='';
	$GEOPHYSICAL_POINT_OBSERVATION_date='';
	$GEOPHYSICAL_POINT_OBSERVATION_time='';
	$GEOPHYSICAL_POINT_OBSERVATION_data_source_flag='';
	$GEOPHYSICAL_POINT_OBSERVATION_latitude_coordinate='';
	$GEOPHYSICAL_POINT_OBSERVATION_longitude_coordinate='';
	$GEOPHYSICAL_REPORT_TYPE_code='';
	$GEOPHYSICAL_POINT_OBSERVATION_elevation_dimension='';
	$FIXED_WEATHER_STATION_call_letter_identifier='';
	$METEOROLOGICAL_POINT_OBSERVATION_quality_control_process_name='';
	$WIND_OBSERVATION_direction_angle='';
	$WIND_OBSERVATION_direction_quality_code='';
	$WIND_OBSERVATION_type_code='';
	$WIND_OBSERVATION_speed_rate='';
	$WIND_OBSERVATION_speed_quality_code='';
	$SKY_CONDITION_OBSERVATION_ceiling_height_dimension='';
	$SKY_CONDTION_OBSERVATION_ceiling_quality_code='';
	$SKY_CONDITION_OBSERVATION_ceiling_determination_code='';
	$SKY_CONDITION_OBSERVATION_CAVOK_code='';
	$VISIBILITY_OBSERVATION_distance_dimension='';
	$VISIBILITY_OBSERVATION_distance_quality_code='';
	$VISIBILITY_OBSERVATION_variability_code='';
	$VISIBILITY_OBSERVATION_quality_variability_code='';
	$AIR_TEMPERATURE_OBSERVATION_air_temperature='';
	$AIR_TEMPERATURE_OBSERVATION_air_temperature_quality_code='';
	$AIR_TEMPERATURE_OBSERVATION_dew_point_temperature='';
	$AIR_TEMPERATURE_OBSERVATION_dew_point_quality_code='';
	$ATMOSPHERIC_PRESSURE_OBSERVATION_sea_level_pressure='';
	$ATMOSPHERIC_PRESSURE_OBSERVATION_sea_level_pressure_quality_code='';

	$lines = exec(" wc -l $filename "); // gettting # of items

	if ($lines == 0) { return false; } // incorrect data file

	// data parsing
	$i = 1;
	foreach(file($filename) as $line) {
	//	echo "</br>".$line."</br></br>";

		$TOTAL_VARIABLE_CHARACTERS=substr($line, 0, 4);
		if (!ctype_digit($TOTAL_VARIABLE_CHARACTERS)) { 
			return false; // incorrect data file
		}
		$FIXED_WEATHER_STATION_USAF_MASTER_STATION_CATALOG_identifier=substr($line, 4, 6);
		$FIXED_WEATHER_STATION_NCEI_WBAN_identifier=substr($line, 10, 5);
		$GEOPHYSICAL_POINT_OBSERVATION_date=substr($line, 15, 8);
		$GEOPHYSICAL_POINT_OBSERVATION_time=substr($line, 23, 4);
		$GEOPHYSICAL_POINT_OBSERVATION_data_source_flag=substr($line, 27, 1);
		$GEOPHYSICAL_POINT_OBSERVATION_latitude_coordinate=substr($line, 28, 6);
		$GEOPHYSICAL_POINT_OBSERVATION_longitude_coordinate=substr($line, 34, 7);
		$GEOPHYSICAL_REPORT_TYPE_code=substr($line, 41, 5);
		$GEOPHYSICAL_POINT_OBSERVATION_elevation_dimension=substr($line, 46, 5);
		$FIXED_WEATHER_STATION_call_letter_identifier=substr($line, 51, 5);
		$METEOROLOGICAL_POINT_OBSERVATION_quality_control_process_name=substr($line, 56, 4);
		$WIND_OBSERVATION_direction_angle=substr($line, 60, 3);
		$WIND_OBSERVATION_direction_quality_code=substr($line, 63, 1);
		$WIND_OBSERVATION_type_code=substr($line, 64, 1);
		$WIND_OBSERVATION_speed_rate=substr($line, 65, 4);
		$WIND_OBSERVATION_speed_quality_code=substr($line, 69, 1);
		$SKY_CONDITION_OBSERVATION_ceiling_height_dimension=substr($line, 70, 5);
		$SKY_CONDTION_OBSERVATION_ceiling_quality_code=substr($line, 75, 1);
		$SKY_CONDITION_OBSERVATION_ceiling_determination_code=substr($line, 76, 1);
		$SKY_CONDITION_OBSERVATION_CAVOK_code=substr($line, 77, 1);
		$VISIBILITY_OBSERVATION_distance_dimension=substr($line, 78, 6);
		$VISIBILITY_OBSERVATION_distance_quality_code=substr($line, 84, 1);
		$VISIBILITY_OBSERVATION_variability_code=substr($line, 85, 1);
		$VISIBILITY_OBSERVATION_quality_variability_code=substr($line, 86, 1);
		$AIR_TEMPERATURE_OBSERVATION_air_temperature=substr($line, 87, 5);
		$AIR_TEMPERATURE_OBSERVATION_air_temperature_quality_code=substr($line, 92, 1);
		$AIR_TEMPERATURE_OBSERVATION_dew_point_temperature=substr($line, 93, 5);
		$AIR_TEMPERATURE_OBSERVATION_dew_point_quality_code=substr($line, 98, 1);
		$ATMOSPHERIC_PRESSURE_OBSERVATION_sea_level_pressure=substr($line, 99, 5);
		$ATMOSPHERIC_PRESSURE_OBSERVATION_sea_level_pressure_quality_code=substr($line, 104, 1);

		if ($AIR_TEMPERATURE_OBSERVATION_air_temperature != '+9999')
			$AIR_TEMPERATURE_OBSERVATION_air_temperature = floatval($AIR_TEMPERATURE_OBSERVATION_air_temperature) / 10;
		if ($AIR_TEMPERATURE_OBSERVATION_dew_point_temperature != '+9999')
			$AIR_TEMPERATURE_OBSERVATION_dew_point_temperature = floatval($AIR_TEMPERATURE_OBSERVATION_dew_point_temperature) / 10;
		if ($ATMOSPHERIC_PRESSURE_OBSERVATION_sea_level_pressure != '99999')
			$ATMOSPHERIC_PRESSURE_OBSERVATION_sea_level_pressure = floatval($ATMOSPHERIC_PRESSURE_OBSERVATION_sea_level_pressure) / 10;

		$query = "CALL SP_UploadData('$FIXED_WEATHER_STATION_USAF_MASTER_STATION_CATALOG_identifier', '$FIXED_WEATHER_STATION_NCEI_WBAN_identifier', '$GEOPHYSICAL_POINT_OBSERVATION_date', '$GEOPHYSICAL_POINT_OBSERVATION_time', '$GEOPHYSICAL_POINT_OBSERVATION_data_source_flag', '$GEOPHYSICAL_POINT_OBSERVATION_latitude_coordinate', '$GEOPHYSICAL_POINT_OBSERVATION_longitude_coordinate', '$GEOPHYSICAL_REPORT_TYPE_code', '$GEOPHYSICAL_POINT_OBSERVATION_elevation_dimension', '$FIXED_WEATHER_STATION_call_letter_identifier', '$METEOROLOGICAL_POINT_OBSERVATION_quality_control_process_name', '$WIND_OBSERVATION_direction_angle', '$WIND_OBSERVATION_direction_quality_code', '$WIND_OBSERVATION_type_code', '$WIND_OBSERVATION_speed_rate', '$WIND_OBSERVATION_speed_quality_code', '$SKY_CONDITION_OBSERVATION_ceiling_height_dimension', '$SKY_CONDTION_OBSERVATION_ceiling_quality_code', '$SKY_CONDITION_OBSERVATION_ceiling_determination_code', '$SKY_CONDITION_OBSERVATION_CAVOK_code', '$VISIBILITY_OBSERVATION_distance_dimension', '$VISIBILITY_OBSERVATION_distance_quality_code', '$VISIBILITY_OBSERVATION_variability_code', '$VISIBILITY_OBSERVATION_quality_variability_code', '$AIR_TEMPERATURE_OBSERVATION_air_temperature', '$AIR_TEMPERATURE_OBSERVATION_air_temperature_quality_code', '$AIR_TEMPERATURE_OBSERVATION_dew_point_temperature', '$AIR_TEMPERATURE_OBSERVATION_dew_point_quality_code', '$ATMOSPHERIC_PRESSURE_OBSERVATION_sea_level_pressure', '$ATMOSPHERIC_PRESSURE_OBSERVATION_sea_level_pressure_quality_code');";
	//	echo ($query);
		$GLOBALS['DBCONNECTION']->sendQuery($query);
		$row  = $GLOBALS['DBCONNECTION']->fetchAssoc();
		$Idx = $row["InsertedID"];

		if ($Idx != '')
		{ // data is newly added
			$Additional_Data  = right($line, strlen($line)-105);
			$GEOPHYSICAL_POINT_OBSERVATION_additional_data_identifier=left_reference($Additional_Data, 3);
			if ($GEOPHYSICAL_POINT_OBSERVATION_additional_data_identifier == 'ADD')
			{
				$fld = array();
				while (strlen($Additional_Data) > 3)
				{
					// additional data exists
					$identifier=left_reference($Additional_Data, 3);
					switch ($identifier)
					{
						case 'AA1':
						case 'AA2':
						case 'AA3':
						case 'AA4':
						{
							$tmp = left_reference($Additional_Data, 2);
							$fld[] = ($tmp=='99')?'NULL':$tmp;

							$tmp = left_reference($Additional_Data, 4);
							$fld[] = ($tmp=='9999')?'NULL':$tmp;

							$tmp = left_reference($Additional_Data, 1);
							$fld[] = ($tmp=='9')?'NULL':$tmp;

							$fld[] = left_reference($Additional_Data, 1);

							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'AB1':
						{
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'AC1':
						{
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'AD1':
						{
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'AE1':
						{
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 2);			
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'AG1':
						{
							$tmp = left_reference($Additional_Data, 1);
							$fld[] = ($tmp=='9')?'NULL':$tmp;

							$tmp = left_reference($Additional_Data, 3);
							$fld[] = ($tmp=='999')?'NULL':$tmp;

							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'AH1':
						case 'AH2':
						case 'AH3':
						case 'AH4':
						case 'AH5':
						case 'AH6':
						case 'AH7':
						{
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 6);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'AI1':
						case 'AI2':
						case 'AI3':
						case 'AI4':
						case 'AI5':
						case 'AI6':
						case 'AI7':
						{
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 6);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'AJ1':
						{
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 6);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'AK1':
						{
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 6);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'AL1':
						case 'AL2':
						case 'AL3':
						case 'AL4':
						{
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;



						case 'AM1':
						{
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'AM1':
						{
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'AO1':
						case 'AO2':
						case 'AO3':
						case 'AO4':
						{
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'AU1':
						case 'AU2':
						case 'AU3':
						case 'AU4':
						{
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'AW1':
						case 'AW2':
						case 'AW3':
						case 'AW4':
						{
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'AX1':
						case 'AX2':
						case 'AX3':
						case 'AX4':
						{
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'AY1':
						case 'AY2':
						case 'AY3':
						case 'AY4':
						{
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'AZ1':
						case 'AZ2':
						{
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'CB1':
						case 'CB2':
						{
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 6);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'CF1':
						case 'CF2':
						case 'CF3':
						{
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'CG1':
						case 'CG2':
						case 'CG3':
						{
							$fld[] = left_reference($Additional_Data, 6);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'CH1':
						case 'CH2':
						{
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'CI1':
						{
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'CN1':
						{
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'CN2':
						{
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'CN3':
						{
							$fld[] = left_reference($Additional_Data, 6);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 6);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'CN4':
						{
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'CO1':
						{
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 3);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'CO2':
						case 'CO3':
						case 'CO4':
						case 'CO5':
						case 'CO6':
						case 'CO7':
						case 'CO8':
						case 'CO9':
						{
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 5);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;



						case 'CR1':
						{
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'CT1':
						case 'CT2':
						case 'CT3':
						{
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'CU1':
						case 'CU2':
						case 'CU3':
						{
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'CV1':
						case 'CV2':
						case 'CV3':
						{
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'CW1':
						{
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'CX1':
						case 'CX2':
						case 'CX3':
						{
							$fld[] = left_reference($Additional_Data, 6);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'ED1':
						{
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;



						case 'GA1':
						case 'GA2':
						case 'GA3':
						case 'GA4':
						case 'GA5':
						case 'GA6':
						{
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 6);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'GD1':
						case 'GD2':
						case 'GD3':
						case 'GD4':
						case 'GD5':
						case 'GD6':
						{
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 6);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'GE1':
						{
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 6);
							$fld[] = left_reference($Additional_Data, 6);
							$fld[] = left_reference($Additional_Data, 6);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'GF1':
						{
							$tmp = left_reference($Additional_Data, 2); $fld[] = ($tmp=='99')?'NULL':$tmp;
							$tmp = left_reference($Additional_Data, 2); $fld[] = ($tmp=='99')?'NULL':$tmp;
							$fld[] = left_reference($Additional_Data, 1);
							$tmp = left_reference($Additional_Data, 2); $fld[] = ($tmp=='99')?'NULL':$tmp;
							$fld[] = left_reference($Additional_Data, 1);
							$tmp = left_reference($Additional_Data, 2); $fld[] = ($tmp=='99')?'NULL':$tmp;
							$fld[] = left_reference($Additional_Data, 1);
							$tmp = left_reference($Additional_Data, 5); $fld[] = ($tmp=='99999')?'NULL':$tmp;
							$fld[] = left_reference($Additional_Data, 1);
							$tmp = left_reference($Additional_Data, 2); $fld[] = ($tmp=='99')?'NULL':$tmp;
							$fld[] = left_reference($Additional_Data, 1);
							$tmp = left_reference($Additional_Data, 2); $fld[] = ($tmp=='99')?'NULL':$tmp;
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'GG1':
						case 'GG2':
						case 'GG3':
						case 'GG4':
						case 'GG5':
						case 'GG6':
						{
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'GH1':
						{
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'GJ1':
						{
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'GK1':
						{
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'GL1':
						{
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'GM1':
						{
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'GN1':
						{
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 1);			
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'GO1':
						{
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);			
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'GP1':
						{
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 3);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'GQ1':
						{
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'GR1':
						{
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'HL1':
						{
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'IA1':
						{
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'IA2':
						{
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'IB1':
						{
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'IB2':
						{
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'IC1':
						{
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'KA1':
						case 'KA2':
						case 'KA3':
						case 'KA4':
						{
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'KB1':
						case 'KB2':
						case 'KB3':
						case 'KB4':
						{
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'KC1':
						case 'KC2':
						case 'KC3':
						case 'KC4':
						{
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 6);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'KD1':
						case 'KD2':
						{
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'KE1':
						{
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'KG1':
						case 'KG2':
						case 'KG3':
						case 'KG4':
						{
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'MA1':
						{
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'MD1':
						{
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'ME1':
						{
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'MF1':
						{
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'MG1':
						{
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'MH1':
						{
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'MK1':
						{
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 6);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 6);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'MV1':
						case 'MV2':
						case 'MV3':
						case 'MV4':
						case 'MV5':
						case 'MV6':
						case 'MV7':
						{
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'MW1':
						case 'MW2':
						case 'MW3':
						case 'MW4':
						case 'MW5':
						case 'MW6':
						case 'MW7':
						{
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'OA1':
						case 'OA2':
						case 'OA3':
						{
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'OB1':
						case 'OB2':
						{
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'OC1':
						{
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'OD1':
						case 'OD2':
						case 'OD3':
						{
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 3);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'OE1':
						case 'OE2':
						case 'OE3':
						{
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'RH1':
						case 'RH2':
						case 'RH3':
						{
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'SA1':
						{
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'ST1':
						{
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 4);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'UA1':
						{
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'UG1':
						{
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'UG2':
						{
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'WA1':
						{
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'WD1':
						{
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;



						case 'WG1':
						{
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 2);
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 1);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'REM':
						{
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 999);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'EQD':
						{
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 3);
							$fld[] = left_reference($Additional_Data, 6);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 6);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'N01': case 'N02': case 'N03': case 'N04': case 'N05': case 'N06': case 'N07': case 'N08': case 'N09': case 'N10': case 'N11': case 'N12': case 'N13': case 'N14': case 'N15': case 'N16': case 'N17': case 'N18': case 'N19': case 'N20': case 'N21': case 'N22': case 'N23': case 'N24': case 'N25': case 'N26': case 'N27': case 'N28': case 'N29': case 'N30': case 'N31': case 'N32': case 'N33': case 'N34': case 'N35': case 'N36': case 'N37': case 'N38': case 'N39': case 'N40': case 'N41': case 'N42': case 'N43': case 'N44': case 'N45': case 'N46': case 'N47': case 'N48': case 'N49': case 'N50': case 'N51': case 'N52': case 'N53': case 'N54': case 'N55': case 'N56': case 'N57': case 'N58': case 'N59': case 'N60': case 'N61': case 'N62': case 'N63': case 'N64': case 'N65': case 'N66': case 'N67': case 'N68': case 'N69': case 'N70': case 'N71': case 'N72': case 'N73': case 'N74': case 'N75': case 'N76': case 'N77': case 'N78': case 'N79': case 'N80': case 'N81': case 'N82': case 'N83': case 'N84': case 'N85': case 'N86': case 'N87': case 'N88': case 'N89': case 'N90': case 'N91': case 'N92': case 'N93': case 'N94': case 'N95': case 'N96': case 'N97': case 'N98': case 'N99':
						{
							$fld[] = left_reference($Additional_Data, 6);
							$fld[] = left_reference($Additional_Data, 1);
							$fld[] = left_reference($Additional_Data, 6);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;


						case 'QNN':
						{
							$fld[] = left_reference($Additional_Data, 5);
							$fld[] = left_reference($Additional_Data, 6);
							CreateTable($identifier, $fld);
							InsertToTable($identifier, $fld, $Idx);
						}
						break;
					}

					unset($fld); // reset array
				}

			}
		}

		// Total processes
		$percent = intval($i/$lines * 100)."%";
		
		// Javascript for updating the progress bar and information
		echo '<script language="javascript">
		document.getElementById("progress").innerHTML="<div style=\"width:'.$percent.';background-color:#ddd;\">&nbsp;</div>";
		document.getElementById("information").innerHTML="'.$i.' row(s) processed.";
		</script>';
		

		// This is for the buffer achieve the minimum size in order to flush data
		echo str_repeat(' ',1024*64);

		// Send output to browser immediately
		flush();

		$i++;
	}

	unlink($filename); // remove uploaded file
	return true;
}