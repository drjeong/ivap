<?php
// Define a 32-byte (64 character) hexadecimal encryption key
// Note: The same encryption key used to encrypt the data must be used to decrypt the data
define('ENCRYPTION_KEY', 'd9e130e2e025a01ef8a0f9fcafc9d6eba35e00be27dc601a7623b80a445c3d7f');
// Encrypt Function
//function mc_encrypt($encrypt){
//	$key = ENCRYPTION_KEY;
//    $encrypt = serialize($encrypt);
//    $iv = mcrypt_create_iv(mcrypt_get_iv_size(MCRYPT_CAST_256, MCRYPT_MODE_CBC), MCRYPT_DEV_URANDOM);
//    $key = pack('h*', $key);
//    $mac = hash_hmac('sha256', $encrypt, substr(bin2hex($key), -32));
//    $passcrypt = mcrypt_encrypt(MCRYPT_CAST_256, $key, $encrypt.$mac, MCRYPT_MODE_CBC, $iv);
//    $encoded = base64_encode($passcrypt).'|'.base64_encode($iv);
//    return $encoded;
//}
//// Decrypt Function
//function mc_decrypt($decrypt){
//	$key = ENCRYPTION_KEY;
//    $decrypt = explode('|', $decrypt.'|');
//    $decoded = base64_decode($decrypt[0]);
//    $iv = base64_decode($decrypt[1]);
//    if(strlen($iv)!==mcrypt_get_iv_size(MCRYPT_CAST_256, MCRYPT_MODE_CBC)){ return false; }
//    $key = pack('h*', $key);
//    $decrypted = trim(mcrypt_decrypt(MCRYPT_CAST_256, $key, $decoded, MCRYPT_MODE_CBC, $iv));
//    $mac = substr($decrypted, -64);
//    $decrypted = substr($decrypted, 0, -64);
//    $calcmac = hash_hmac('sha256', $decrypted, substr(bin2hex($key), -32));
//    if($calcmac!==$mac){ return false; }
//    $decrypted = unserialize($decrypted);
//    return $decrypted;
//}

function DataEncrypt($data, $pepper){
	$hex = hexdec($pepper);
	$key = substr(ENCRYPTION_KEY, strlen($hex));
	$key = $key.$hex;
    $encrypt = serialize($data);
    $iv = mcrypt_create_iv(mcrypt_get_iv_size(MCRYPT_CAST_256, MCRYPT_MODE_CBC), MCRYPT_DEV_URANDOM);
    $key = pack('h*', $key);
    $mac = hash_hmac('sha256', $encrypt, substr(bin2hex($key), -32));
    $passcrypt = mcrypt_encrypt(MCRYPT_CAST_256, $key, $encrypt.$mac, MCRYPT_MODE_CBC, $iv);
    $encoded = base64_encode($passcrypt).'|'.base64_encode($iv);
    return $encoded;
}

// Decrypt Function
function DataDecrypt($data, $pepper){
	$hex = hexdec($pepper);
	$key = substr(ENCRYPTION_KEY, strlen($hex));
	$key = $key.$hex;
    $decrypt = explode('|', $data.'|');
    $decoded = base64_decode($decrypt[0]);
    $iv = base64_decode($decrypt[1]);
    if(strlen($iv)!==mcrypt_get_iv_size(MCRYPT_CAST_256, MCRYPT_MODE_CBC)){ return false; }
    $key = pack('h*', $key);
    $decrypted = trim(mcrypt_decrypt(MCRYPT_CAST_256, $key, $decoded, MCRYPT_MODE_CBC, $iv));
    $mac = substr($decrypted, -64);
    $decrypted = substr($decrypted, 0, -64);
    $calcmac = hash_hmac('sha256', $decrypted, substr(bin2hex($key), -32));
    if($calcmac!==$mac){ return false; }
    $decrypted = unserialize($decrypted);
    return $decrypted;
}