<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAdvisoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'prediction_code' => ['required', 'integer', 'unique:advisory_templates,prediction_code'],
            'hive_state'      => ['required', 'string', 'max:50', 'unique:advisory_templates,hive_state'],
            'condition_label' => ['required', 'string', 'max:100'],
            'advisory_text'   => ['required', 'string'],
            'advisory_type'   => ['required', 'string', 'max:30'],
            'severity'        => ['required', 'string', 'max:20'],
        ];
    }
}
