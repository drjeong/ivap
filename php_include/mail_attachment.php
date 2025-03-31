<?php
require_once ('config.php');

function NotifyAdminByEmail($subject, $message)
{
    if (__EMAILNOTIFICATION === true) {
        $msgtail = "<br/><br/><br/>-----------------------------------------<br/>PLEASE NOTE: This email is for notification purposes only. Please do not reply to this email for any purpose.";
        sendmail_attachment(__ADMIN_EMAILADDRESS, __ADMIN_EMAILADDRESS, '', $subject, $message, '', '');
    }
}

function NotifyUserByEmail($to, $subject, $message)
{
    if (__EMAILNOTIFICATION === true) {
        $msgtail = "<br/><br/><br/>-----------------------------------------<br/>PLEASE NOTE: This email is for notification purposes only. Please do not reply to this email for any purpose.";
        sendmail_attachment(__ADMIN_EMAILADDRESS, $to, '', $subject, $message, '', $msgtail);
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SENDMAIL
// requires sendmail module in linux machine
// sudo apt-get install sendmail
// sudo service apache2 restart
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//function SendEmailtoStudent($from , $to, $cc, $subject, $message, $attachment)
//{	// This is for sending a duplicated email to the sender email address.
//	return (sendmail_attachment($from, $to, $cc, $subject, $message, $attachment, ''));
//}

function sendmail_attachment ($from, $to, $cc, $subject, $message, $attachment, $msgtail)
{
	/** 
	 * https://myaccount.google.com/security
	 * This example shows settings to use when sending via Google's Gmail servers.
	 */

	//SMTP needs accurate times, and the PHP time zone MUST be set
	//This should be done in your php.ini, but this is how to do it if you don't have access to that
	date_default_timezone_set('Etc/UTC');

	require_once (dirname(__FILE__) .'/../toolbox/PHPMailer/PHPMailerAutoload.php');	

	//Create a new PHPMailer instance
	$mail = new PHPMailer;

	// Set PHPMailer to use the sendmail transport
	$mail->isSendmail();

	//Set who the message is to be sent from
	$mail->SetFrom(__SERVER_SENDMAIL, "Web-Master");
//	$mail->SetFrom($from, $from);

	//Set an alternative reply-to address
	$mail->AddReplyTo($from, $from);

	//Set who the message is to be sent to
	$mail->AddAddress($to, $to);

	//Set the subject line
	$mail->Subject = $subject;

	// send email as html
	$mail->IsHTML(true);

	//Read an HTML message body from an external file, convert referenced images to embedded,
	//convert HTML into a basic plain-text alternative body
	//$mail->msgHTML(file_get_contents('contents.html'), dirname(__FILE__));

	if ($msgtail != '')
		$message .= $msgtail;

	$mail->Body = $message;

	//Replace the plain text body with one created manually
//	$mail->AltBody = 'This is a plain-text message body';

	//Attach an image file
	if ($attachment!='')
		$mail->addAttachment($attachment);

	//Send this email to the sender as CC
	$mail->AddCC($from);

	//Set who the message is to be sent to as CC
	if ($cc != '')
	{
		if (strpos($cc, ";") != FALSE)
			$ccrecipients = explode(";",$cc); // seperate by semicolon
		elseif (strpos($cc, ",") != FALSE)
			$ccrecipients = explode(",",$cc); // seperate by comma
		else
			$ccrecipients = explode(" ",$cc); // seperate by space

		foreach($ccrecipients as $ccemail)
		{
			$ccemail = trim($ccemail); // trim whitespace
			if ($ccemail != '') $mail->AddCC($ccemail);
		}
	}

	//send the message, check for errors
	if (!$mail->send()) {
		error_log("Mailer Error: " . $mail->ErrorInfo . "[$from, $to, $cc, $subject, $message, $attachment, $msgtail]");
		return false;
	}
	return true;  // Message sent!
}

