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
            'prediction_code' => ['sometimes', 'integer', Rule::unique('advisory_templates', 'prediction_code')->ignore($id, 'template_id')],
            'hive_state'      => ['sometimes', 'string', 'max:50', Rule::unique('advisory_templates', 'hive_state')->ignore($id, 'template_id')],
            'condition_label' => ['sometimes', 'string', 'max:100'],
            'advisory_text'   => ['sometimes', 'string'],
            'advisory_type'   => ['sometimes', 'string', 'max:30'],
            'severity'        => ['sometimes', 'string', 'max:20'],
        ];
    }
}
