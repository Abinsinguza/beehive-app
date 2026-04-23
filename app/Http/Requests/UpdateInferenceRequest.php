<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateInferenceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'hive_id'           => ['sometimes', 'string', 'exists:beehives,id'],
            'prediction'        => ['sometimes', 'string', 'in:Normal,Pre-swarm,Swarm,Abscondment,Uncertain'],
            'confidence_score'  => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'inference_latency' => ['sometimes', 'numeric', 'min:0'],
            'analyzed_at'       => ['sometimes', 'date'],
        ];
    }
}
