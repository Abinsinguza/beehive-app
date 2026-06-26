<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAdvisoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('advisory')?->getKey();

        return [
            'prediction_code'          => ['sometimes', 'numeric', Rule::unique('advisory_templates', 'prediction_code')->ignore($id, 'template_id')],
            'hive_state'               => ['sometimes', 'string', 'max:50', Rule::unique('advisory_templates', 'hive_state')->ignore($id, 'template_id')],
            'advisory_type'            => ['sometimes', 'string', 'max:30'],
            'severity'                 => ['sometimes', 'string', 'in:critical,warning,info'],
            'min_confidence_threshold' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'description'              => ['nullable', 'string'],
        ];
    }
}
