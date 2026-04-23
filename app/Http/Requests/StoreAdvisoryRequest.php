<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreAdvisoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'prediction_code'  => ['required', 'integer'],
            'condition_label'  => ['required', 'string', 'max:255'],
            'advisory_text'    => ['required', 'string'],
            'severity'         => ['required', 'string', 'in:low,medium,high,critical'],
        ];
    }
}
