<?php
/**
 * Title: Stations
 * File: stations.php
 * Author: Dong H Jeong
 * Desc: Showing all weather stations
 * History
 *  - 07/01/2023 Initial version created
 *
 * References
 *
 */
?>

<script  class="init">
    $(document).ready(function() {
        DataTable_Data = $("#precipitationdata").DataTable({
            "dom": 'Blfrtip', // showing Excel button at the beginning with "B"
            "processing": true,
            "serverSide": true,
            "lengthMenu": [ 30, 50, 100, 500, 1000, 2000, 4000, 8000],
            "ajax": "ssps/ssps_stations.php",
            "order": [[ 1, 'asc' ]],
            "fnDrawCallback": function() {
                $('#precipitationdata tr td:nth-child(1)').css('text-align', 'center');
                $('#precipitationdata tr td:nth-child(2)').css('text-align', 'center');
                $('#precipitationdata tr td:nth-child(3)').css('text-align', 'center');
                $('#precipitationdata tr td:nth-child(4)').css('text-align', 'center');
                $('#precipitationdata tr td:nth-child(5)').css('text-align', 'center');
                $('#precipitationdata tr td:nth-child(6)').css('text-align', 'center');
                $('#precipitationdata tr td:nth-child(7)').css('text-align', 'center');
                $('#precipitationdata tr td:nth-child(8)').css('text-align', 'center');
                $('#precipitationdata tr td:nth-child(9)').css('text-align', 'center');
                $('#precipitationdata tr td:nth-child(10)').css('text-align', 'center');
            },
            "columns": [
                { "data": 'COOP_ID' },
                // { "data": 'GHCND_ID' },
                { "data": 'NCDC_ID' },
                // { "data": 'NWSLI_ID' },
                // { "data": 'FAA_ID' },
                { "data": 'WBAN_ID' },
                // { "data": 'WMO_ID' },
                // { "data": 'ICAO_ID' },
                // { "data": 'TRANSMITTAL_ID' },
                { "data": 'NAME' },
                { "data": 'ST' },
                // { "data": 'COUNTRY_CODE' },
                { "data": 'ELEV' },
                { "data": 'LAT' },
                { "data": 'LON' },
                { "data": 'BEG_DT' },
                { "data": 'END_DT' }
            ],
            "columnDefs": [ {
                "targets"  : 'no-sort',
                "orderable": false,
            }],
            buttons: [ {
                extend: 'excelHtml5',
                title: 'Hourly Precipitation'
            }]
        });


        // Setup - add a text input to each footer cell
        $('#precipitationdata tfoot th').each( function () {
            var title = $(this).text();
            if (title != "") $(this).html( '<input type="text" placeholder="Search '+title+'" style="color:black; width: 100%;padding:1px;box-sizing: border-box;"/>' );
        } );

        // Apply the search
        DataTable_Data.columns().every( function () {
            var that = this;

            $( 'input', this.footer() ).on( 'keyup change', function () {
                if ( that.search() !== this.value ) {
                    that
                        .search( this.value )
                        .draw();
                }
            });
        } );
    } );
</script>

	<div class="pagebacklayout_inner_noborder" style="min-height:400px">
		<table style="width:100%; padding: 0; border-spacing:0; margin-bottom:0.1in;">
		<tr>
			<td width="50%">		
			</td>
			<td width="50%" align="right">
            </td>
		</tr>
		</table>
		<div class="CSSTable_SSPSLIST">
			<table id="precipitationdata" class="display" style="width:100%; padding: 0; border-spacing:0;">
			<thead>
				<tr>
                    <th>COOP_ID</th>
<!--                    <th>GHCND_ID</th>-->
                    <th>NCDC_ID</th>
<!--                    <th>NWSLI_ID</th>-->
<!--                    <th>FAA_ID</th>-->
                    <th>WBAN_ID</th>
<!--                    <th>WMO_ID</th>-->
<!--                    <th>ICAO_ID</th>-->
<!--                    <th>TRANSMITTAL_ID</th>-->
                    <th>NAME</th>
                    <th>ST</th>
<!--                    <th>COUNTRY</th>-->
                    <th>ELEV</th>
                    <th>LAT</th>
                    <th>LON</th>
                    <th>BEG_DT</th>
                    <th>END_DT</th>
				</tr>
			</thead>
			<tfoot>
				<tr>
                    <th>COOP_ID</th>
<!--                    <th>GHCND_ID</th>-->
                    <th>NCDC_ID</th>
<!--                    <th>NWSLI_ID</th>-->
<!--                    <th>FAA_ID</th>-->
                    <th>WBAN_ID</th>
<!--                    <th>WMO_ID</th>-->
<!--                    <th>ICAO_ID</th>-->
<!--                    <th>TRANSMITTAL_ID</th>-->
                    <th>NAME</th>
                    <th>ST</th>
<!--                    <th>COUNTRY</th>-->
                    <th>ELEV</th>
                    <th>LAT</th>
                    <th>LON</th>
                    <th>BEG_DT</th>
                    <th>END_DT</th>
				</tr>
			</tfoot>
			</table>
		</div>
	</div>
