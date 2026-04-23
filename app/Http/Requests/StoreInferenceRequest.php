<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreInferenceRequest extends FormRequest
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
            'hive_id'           => ['required', 'string', 'exists:beehives,id'],
            'prediction'        => ['required', 'string', 'in:Normal,Pre-swarm,Swarm,Abscondment,Uncertain'],
            'confidence_score'  => ['required', 'numeric', 'min:0', 'max:100'],
            'inference_latency' => ['required', 'numeric', 'min:0'],
            'analyzed_at'       => ['required', 'date'],
        ];
    }
}
