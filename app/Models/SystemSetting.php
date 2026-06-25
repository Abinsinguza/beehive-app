<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = ['key', 'value'];

    public static function get(string $key, mixed $default = null): mixed
    {
        $value = static::where('key', $key)->value('value');
        
        if ($value === null) {
            return $default;
        }
        
        // Handle boolean values
        if (strtolower($value) === 'true') {
            return true;
        }
        if (strtolower($value) === 'false') {
            return false;
        }
        
        // Handle numeric values
        if (is_numeric($value)) {
            if (strpos($value, '.') !== false) {
                return (float)$value;
            }
            return (int)$value;
        }
        
        return $value;
    }

    public static function set(string $key, mixed $value): void
    {
        if (is_bool($value)) {
            $value = $value ? 'true' : 'false';
        } elseif (is_numeric($value)) {
            $value = (string)$value;
        }
        
        static::updateOrCreate(['key' => $key], ['value' => $value]);
    }
}
