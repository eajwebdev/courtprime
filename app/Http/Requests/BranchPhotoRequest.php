<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BranchPhotoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            /*
             * Required when adding, optional when only the label changes.
             *
             * Both routes are POST because update carries a file, so the method
             * cannot tell them apart: keying on isMethod('post') made the image
             * mandatory on update and silently rejected caption-only edits. The
             * presence of the {photo} route parameter is the real signal.
             */
            'photo' => [$this->route('photo') ? 'nullable' : 'required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'caption' => ['nullable', 'string', 'max:120'],
        ];
    }

    public function messages(): array
    {
        return [
            'photo.image' => 'The gallery item must be an image file.',
            'photo.max' => 'Gallery images must be smaller than 4MB.',
            'caption.max' => 'Keep the label under 120 characters.',
        ];
    }
}
