<?php include('header.php'); ?>

<!-- Information Should be here BEGIN-->
<script  class="init">
$(document).ready(function() {
	DataTable_Advisors = $("#precipitationdata").DataTable({
		"processing": true,
		"serverSide": true,
		"ajax": "ssps/ssps_dataupload_logs.php",
		"order": [[ 4, 'dsc' ]],
		"fnDrawCallback": function() {
			$('#precipitationdata tr td:nth-child(1)').css('text-align', 'center');
			$('#precipitationdata tr td:nth-child(2)').css('text-align', 'center');
			$('#precipitationdata tr td:nth-child(3)').css('text-align', 'center');
			$('#precipitationdata tr td:nth-child(4)').css('text-align', 'center');
			$('#precipitationdata tr td:nth-child(5)').css('text-align', 'center');
			$('#precipitationdata tr td:nth-child(6)').css('text-align', 'center');
			$('#precipitationdata tr td:nth-child(7)').css('text-align', 'center');
		},		
		"columns": [
			{ "data": 'User' },
			{ "data": 'FileName' },
			{ "data": 'NumOfLines' },
			{ "data": 'Date' },
			{ "data": 'FinDate' }
		],
		"columnDefs": [ {
			"targets"  : 'no-sort',
			"orderable": false,
		}]
	});
} );
</script>

<div class="pagebacklayout">
	<div style="width:100%;height:30px">
		<p style="margin-top:0.2in;text-align:center;"><span style="font-size:12pt;font-weight:bold;">&nbsp;PRECIPITATION HOURLY DATA - UPLOADING LOGS </span>&nbsp;
		</p>
	</div>

	<div class="pagebacklayout_inner_noborder" style="min-height:400px">
		<table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:0.1in;">
		<tr>
			<td width="50%">		
			</td>
			<td width="50%" align="right">
                <button class="btn btn-info btn-sm" onclick="javascript:location.href='stations_summary.php';return false;">DATA SUMMARY</button>&nbsp;
		</tr>
		</table>
		<div class="CSSTable_SSPSLIST">
			<table id="precipitationdata" class="display" cellspacing="0" width="100%">
			<thead>
				<tr>
					<th style="width:80px">User</th>
					<th style="width:250px">FileName</th>
					<th style="width:80px">NumOfLines</th>
					<th >START DATE</th>
					<th >FINISH DATE</th>
				</tr>
			</thead>
			</table>
		</div>
		<table width="100%" border="0" style="font-size:8pt;"><tr><td><span style='color:red;font-weight:bold;font-family: "Times New Roman", Georgia, Serif;'></span></td><td align="right">

		</td></tr></table>
	</div>
</div>	

<?php include('footer.php');?>