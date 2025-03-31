<?php
if (!class_exists('Config')) {
    class Config
    {
        // Environment constants
        public const ENV_PHP_DESKTOP = 0x0100;
        public const ENV_APACHE_WINOS = 0x0101;
        public const ENV_APACHE_LINUXOS = 0x0102;

        private static $environment;
        private static $config;

        public static function init($targetEnvironment = null)
        {
            // Validate target environment
            if ($targetEnvironment === null) {
                throw new InvalidArgumentException('Target environment must be specified');
            }

            // Validate environment value
            if (!in_array($targetEnvironment, [
                self::ENV_PHP_DESKTOP,
                self::ENV_APACHE_WINOS,
                self::ENV_APACHE_LINUXOS
            ])) {
                throw new InvalidArgumentException('Invalid target environment specified');
            }

            self::assignSystemEnvironment($targetEnvironment);
            self::loadConfig();
        }

        private static function assignSystemEnvironment($targetEnvironment)
        {
            self::$environment = $targetEnvironment;
            if (!isset($_SESSION['SYSTEM_ENVIRONMENT'])) {
                $_SESSION['SYSTEM_ENVIRONMENT'] = self::$environment;
            }
        }

        private static function loadConfig()
        {
            // Base configuration for all environments
            self::$config = [
                'timezone' => 'America/New_York',
                'debug' => false,
                'display_errors' => false,
                'log_errors' => true,
                'error_reporting' => E_ALL
            ];

            // Environment-specific configurations
            switch (self::$environment) {
                case self::ENV_PHP_DESKTOP:
                    self::loadPhpDesktopConfig();
                    break;

                case self::ENV_APACHE_WINOS:
                    self::loadApacheWindowsConfig();
                    break;

                case self::ENV_APACHE_LINUXOS:
                    self::loadApacheLinuxConfig();
                    break;
            }

            // Apply configurations
            date_default_timezone_set(self::$config['timezone']);
            ini_set('display_errors', self::$config['display_errors']);
            ini_set('log_errors', self::$config['log_errors']);
            error_reporting(self::$config['error_reporting']);
        }

        private static function loadPhpDesktopConfig()
        {
            $parent_parent_path = dirname(__DIR__, 1);

            self::$config = array_merge(self::$config, [
                'db' => [
                    'type' => 'sqlite',
                    'host' => '',
                    'name' => $parent_parent_path . DIRECTORY_SEPARATOR . 'DB/precipitation_allstates.db',
                    'user' => '',
                    'pass' => '',
                    'timezone' => 'America/New_York'
                ],
                'system' => [
                    'email_notification' => false,
                    'background_processing' => false
                ]
            ]);
        }

        private static function loadApacheWindowsConfig()
        {
            self::$config = array_merge(self::$config, [
                'db' => [
                    'type' => 'mysql',
                    'host' => 'localhost',
                    'name' => 'precipitationdb',
                    'user' => 'root',
                    'pass' => '',
                    'timezone' => 'America/New_York'
                ],
                'directories' => [
                    'home' => 'C:\\xampp',
                    'upload' => 'C:\\xampp\\upload\\'
                ],
                'system' => [
                    'email_notification' => false,
                    'background_processing' => false
                ]
            ]);
        }

        private static function loadApacheLinuxConfig()
        {
            self::$config = array_merge(self::$config, [
                'db' => [
                    'type' => 'mysql',
                    'host' => 'localhost',
                    'name' => 'precipitationdb',
                    'user' => 'precipitation',
                    'pass' => 'mH8rebBLGzY6NGT5!',
                    'timezone' => 'America/New_York'
                ],
                'directories' => [
                    'home' => '/home/precipitation',
                    'upload' => '/home/precipitation/upload/'
                ],
                'system' => [
                    'email_notification' => true,
                    'background_processing' => true
                ],
                'email' => [
                    'server_sendmail' => 'web-master@udc.edu',
                    'admin_address' => 'admin@udc.edu',
                    'timezone' => 'America/New_York'
                ]
            ]);
        }

        // Getter methods
        public static function getEnvironment()
        {
            return self::$environment;
        }

        public static function isPhpDesktop()
        {
            return self::$environment === self::ENV_PHP_DESKTOP;
        }

        public static function isApacheWindows()
        {
            return self::$environment === self::ENV_APACHE_WINOS;
        }

        public static function isApacheLinux()
        {
            return self::$environment === self::ENV_APACHE_LINUXOS;
        }

        public static function get($key, $default = null)
        {
            return self::$config[$key] ?? $default;
        }

        public static function getDBConfig()
        {
            return self::$config['db'];
        }

        public static function getDirectories()
        {
            return self::$config['directories'] ?? [];
        }

        public static function getSystemConfig()
        {
            return self::$config['system'];
        }

        public static function getEmailConfig()
        {
            return self::$config['email'] ?? [];
        }
    }


    // Initialize configuration
    try {
        // Initialize with specific environment
        Config::init(Config::ENV_PHP_DESKTOP);
        // or
        // Config::init(Config::ENV_PHP_DESKTOP);
        // Config::init(Config::ENV_APACHE_WINOS);
        // Config::init(Config::ENV_APACHE_LINUXOS);

        // Define constants for backward compatibility
        if (!defined('__DB_TYPE')) {
            $dbConfig = Config::getDBConfig();
            define('__DB_TYPE', $dbConfig['type']);
            define('__DB_HOSTNAME', $dbConfig['host']);
            define('__DB_DBNAME', $dbConfig['name']);
            define('__DB_USERID', $dbConfig['user']);
            define('__DB_USERPWD', $dbConfig['pass']);
            define('__DB_TIMEZONE', $dbConfig['timezone']);

            $sysConfig = Config::getSystemConfig();
            define('__EMAILNOTIFICATION', $sysConfig['email_notification']);
            define('__BACKGROUND_UPLOADEDDATAPROCESSING', $sysConfig['background_processing']);

            if (!Config::isPhpDesktop()) {
                $dirs = Config::getDirectories();
                define('__DIRECTORY_HOME__', $dirs['home']);
                define('__DIRECTORY_UPLOAD__', $dirs['upload']);

                if (Config::isApacheLinux()) {
                    $emailConfig = Config::getEmailConfig();
                    define('__SERVER_SENDMAIL', $emailConfig['server_sendmail']);
                    define('__USER_TIMEZONE', $emailConfig['timezone']);
                    define('__ADMIN_EMAILADDRESS', $emailConfig['admin_address']);
                }
            }
        }

    } catch (InvalidArgumentException $e) {
        // Handle initialization error
        die('Configuration Error: ' . $e->getMessage());
    }
}
