<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBeekeeperRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('beekeeper')?->getKey();

        return [
            'name'     => ['required', 'string', 'max:100'],
            'email'    => ['nullable', 'email', 'max:100', Rule::unique('users', 'email')->ignore($userId, 'user_id')],
            'phone'    => ['required', 'string', 'max:20', Rule::unique('users', 'phone')->ignore($userId, 'user_id')],
            'address'  => ['nullable', 'string'],
            'password' => ['nullable', 'string', 'min:4'],
        ];
    }
}
