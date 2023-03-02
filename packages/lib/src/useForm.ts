import { computed, ComputedRef, reactive, ref, UnwrapRef } from 'vue';
import { Plugin } from './plugins';
import { Field, useField } from './useField';
import { Validator } from './validators';

export type FieldOptions<T> = {
	[Key in keyof T]: [initialValue: T[Key], validators?: Validator[]];
};

export type UseFormOptions = {
	plugins: Plugin[];
};

type Values<T> = {
	[Key in keyof T]: ComputedRef<T[Key]>;
};

export type Fields<T> = {
	[Key in keyof T]: Field<T[Key]>;
};

export interface Form<T = any> {
	values: UnwrapRef<Values<T>>;
	fields: UnwrapRef<Fields<T>>;
	invalid: boolean;
	valid: boolean;
	submitted: boolean;
	setValues: (values: Partial<{ [Key in keyof T]: T[Key] }>) => void;
	reset: () => void;
}

export function useForm<T>(
	fieldOptions: FieldOptions<T>,
	options: UseFormOptions = { plugins: [] }
): Form<T> {
	const fields: Fields<T> = {} as any;
	const values: Values<T> = reactive({}) as any;

	for (const key in fieldOptions) {
		const [initialValue, validators = []] = fieldOptions[key];

		const field = useField(initialValue, { validators });

		values[key] = computed(() => field.value);
		fields[key] = field;
	}

	// Checks if all fields in the form are valid
	const invalid = computed(() => {
		let invalid = false;
		for (const key in fields) {
			if (!invalid) {
				invalid = fields[key].invalid;
			}
		}
		return invalid;
	});
	const valid = computed(() => !invalid.value);

	const setValues = (setValues: Partial<{ [Key in keyof T]: T[Key] }>) => {
		for (const key in setValues) {
			const value = setValues[key];
			fields[key].value = value!;
		}
	};

	const submitted = ref(false);

	// Reset the form back to initial state
	const reset = () => {
		submitted.value = false;
		for (const key in values) {
			fields[key].reset();
		}
	};

	const form: Form<T> = reactive({
		invalid,
		valid,
		submitted,
		values,
		fields,
		setValues,
		reset,
	});

	options.plugins.forEach((plugin) => plugin(form));

	return form;
}
