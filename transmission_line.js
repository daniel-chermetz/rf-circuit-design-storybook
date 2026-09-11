globalThis.divideComplexNums = (n1_real, n1_imag, n2_real, n2_imag) => {
	const n1_theta = Math.atan2(n1_imag, n1_real);
	const n2_theta = Math.atan2(n2_imag, n2_real);

	const n1_magnitude = Math.sqrt(n1_real * n1_real + n1_imag * n1_imag);
	const n2_magnitude = Math.sqrt(n2_real * n2_real + n2_imag * n2_imag);

	const result_magnitude = n1_magnitude / n2_magnitude;
	const result_theta = n1_theta - n2_theta;

	const result_real = result_magnitude * Math.cos(result_theta);
	const result_imag = result_magnitude * Math.sin(result_theta);

	return {
		magnitude: result_magnitude,
		theta: result_theta,
		real: result_real,
		imag: result_imag
	}
}

globalThis.getTLWaveParams = (R, L, G, C, frequency) => {
	const omega = 2 * Math.PI * frequency;

	const gamma_squared_real = R * G - omega * omega * L * C;
	const gamma_squared_imag = omega * R * C + omega * L * G;

	const gamma_squared_length = Math.sqrt(gamma_squared_real * gamma_squared_real + gamma_squared_imag * gamma_squared_imag);
	const gamma_length = Math.sqrt(gamma_squared_length);

	const gamma_squared_theta = Math.atan2(gamma_squared_imag, gamma_squared_real);
	const gamma_theta = gamma_squared_theta / 2;

	console.log('gamma length: ', gamma_length);
	console.log('theta: ', gamma_theta * 180 / Math.PI);

	const alpha = gamma_length * Math.cos(gamma_theta); // gamma real
	const beta = gamma_length * Math.sin(gamma_theta); // gamma imag

	const z0_numerator_length = Math.sqrt(R * R + omega * L * omega * L);
	const z0_numerator_theta = Math.atan2(omega * L, R);

	const z0_magnitude = z0_numerator_length / gamma_length;
	const z0_theta = z0_numerator_theta - gamma_theta;

	const z0_real = z0_magnitude * Math.cos(z0_theta);
	const z0_imag = z0_magnitude * Math.sin(z0_theta);

	console.log('z0_real', z0_real);
	console.log('z0_imag', z0_imag);

	const phase_velocity_up = omega / beta;
	const phase_velocity_frac_of_c = phase_velocity_up / 3e8
	console.log('phase_velocity_frac_of_c: ', phase_velocity_frac_of_c);

	return {
		propagation_gamma_length: gamma_length,
		propagation_gamma_theta: gamma_theta,
		alpha,
		beta,
		phase_velocity_up,
		phase_velocity_frac_of_c,
		z0_magnitude,
		z0_theta,
		z0_real,
		z0_imag
	}
}

globalThis.getTLRefelectionCoefficient = (load_impedance_zl_real, load_impedance_zl_imag, z0_length, z0_theta) => {
	const zl_length = Math.sqrt(load_impedance_zl_real * load_impedance_zl_real + load_impedance_zl_imag * load_impedance_zl_imag);
	const zl_theta = Math.atan2(load_impedance_zl_imag, load_impedance_zl_real);

	const normalized_load_impedance = {};
	normalized_load_impedance.magnitude = zl_length / z0_length;
	normalized_load_impedance.theta = zl_theta - z0_theta;
	normalized_load_impedance.real = normalized_load_impedance.magnitude * Math.cos(normalized_load_impedance.theta);
	normalized_load_impedance.imag = normalized_load_impedance.magnitude * Math.sin(normalized_load_impedance.theta);

	const reflection_numerator_real = normalized_load_impedance.real - 1;
	const reflection_numerator_imag = normalized_load_impedance.imag;
	const reflection_denominator_real = normalized_load_impedance.real + 1;
	const reflection_denominator_imag = normalized_load_impedance.imag;

	const reflection = divideComplexNums(
		reflection_numerator_real,
		reflection_numerator_imag,
		reflection_denominator_real,
		reflection_denominator_imag
	);
	console.log('reflection_length: ', reflection.magnitude);
	console.log('reflection_theta: ', reflection.theta * 180 / Math.PI);

	return {
		normalized_load_impedance,
		reflection
	}
}

globalThis.getStandingWaveRatio_lossless_TL = (reflection) => {
	const standing_wave_ratio = (1 + reflection.magnitude) / (1 - reflection.magnitude);
	console.log('standing_wave_ratio: ', standing_wave_ratio);
	return standing_wave_ratio;
}

globalThis.getImpedanceAtDistanceFromLoad_lossless_TL = (distance, reflection, z0_magnitude, beta) => {
	const phase_shifted_reflection_length = reflection.magnitude;
	const phase_shifted_reflection_theta = reflection.theta - 2 * beta * distance;

	const phase_shifted_reflection_real = phase_shifted_reflection_length * Math.cos(phase_shifted_reflection_theta);
	const phase_shifted_reflection_imag = phase_shifted_reflection_length * Math.sin(phase_shifted_reflection_theta);

	const impedance_to_z0_ratio_at_distance = divideComplexNums(
		1 + phase_shifted_reflection_real, 
		phase_shifted_reflection_imag, 
		1 - phase_shifted_reflection_real,
		-phase_shifted_reflection_imag
	);

	const impedance_at_distance = {
		magnitude: impedance_to_z0_ratio_at_distance.magnitude * z0_magnitude, // for lossless TL, this is the same as z0_real
		theta: impedance_to_z0_ratio_at_distance.theta,
		real: impedance_to_z0_ratio_at_distance.real * z0_magnitude,
		imag: impedance_to_z0_ratio_at_distance.imag * z0_magnitude
	}

	console.log('distance: ', distance);
	console.log('impedance_at_distance', impedance_at_distance);

	return impedance_at_distance;
}

globalThis.get_voltage_as_v0plus_ratio_at_distance_from_load_lossless_TL = (distance, reflection, beta) => {
	// distance is the opposite direction of v0_plus
	const v_to_v0plus_ratio_real = Math.cos(beta * distance) + reflection.magnitude * Math.cos(reflection.theta - beta * distance);
	const v_to_v0plus_ratio_imag = Math.sin(beta * distance) + reflection.magnitude * Math.sin(reflection.theta - beta * distance);

	return {
		v_to_v0plus_ratio_real,
		v_to_v0plus_ratio_imag
	}
}

globalThis.get_generator_related_values_lossless_TL = (
	generator_distance, 
	generator_voltage_real, 
	generator_voltage_imag, 
	generator_impedance_real, 
	generator_impedance_imag,
	reflection,
	z0_magnitude,
	beta
) => {
	const z_in_tl_at_generator = getImpedanceAtDistanceFromLoad_lossless_TL(generator_distance, reflection, z0_magnitude, beta);

	// basic voltage division by impedance ratio
	const voltage_ratio_into_tl_at_generator = divideComplexNums(
		z_in_tl_at_generator.real, 
		z_in_tl_at_generator.imag, 
		generator_impedance_real + z_in_tl_at_generator.real, 
		generator_impedance_imag + z_in_tl_at_generator.imag
	);

	const voltage_into_tl_at_generator_real = voltage_ratio_into_tl_at_generator.real * generator_voltage_real - voltage_ratio_into_tl_at_generator.imag * generator_voltage_imag;
	const voltage_into_tl_at_generator_imag = voltage_ratio_into_tl_at_generator.real * generator_voltage_imag + voltage_ratio_into_tl_at_generator.imag * generator_voltage_real;

	const v0plus_ratio = get_voltage_as_v0plus_ratio_at_distance_from_load_lossless_TL(generator_distance, reflection, beta);

	const v0_plus = divideComplexNums(
		voltage_into_tl_at_generator_real,
		voltage_into_tl_at_generator_imag,
		v0plus_ratio.v_to_v0plus_ratio_real,
		v0plus_ratio.v_to_v0plus_ratio_imag
	);
	console.log('v0_plus: ', v0_plus);

	return v0_plus;
}

/*
	Either constant SWR across normalized load choice (zl),
	or, for a given choice of zl at d=0, rotate around the constant SWR circle
	to find zl at distances from the load
*/
globalThis.get_swr_circle_lossless_TL = (reflection, v0_plus, standing_wave_ratio, z0_magnitude, beta) => {
	const constant_swr_circle = [];
	const wave_length = 2 * Math.PI / beta;

	const d_step = (wave_length / 2 / 36);
	const theta_values = [];
	const distance_values = [];
	for (let d = 0; d < wave_length / 2; d += d_step) {
		let current_theta = reflection.theta - 2 * beta * d;
		if (current_theta < -Math.PI) {
			current_theta = 2 * Math.PI + current_theta;
		}
		theta_values.push(current_theta);
		distance_values.push(d);

		const next_theta = current_theta - 2 * beta * d_step;
		if (current_theta > 0 && next_theta < 0) {
			if (Math.abs(current_theta) < 1e-4 || Math.abs(next_theta) < 1e-4) {
				continue;
			}
			theta_values.push(0);
			let d_for_zero_theta = reflection.theta / (2 * beta);
			if (d_for_zero_theta < 0) {
				d_for_zero_theta = (2 * Math.PI + reflection.theta) / (2 * beta);
			}
			distance_values.push(d_for_zero_theta);
		}
	}

	let theta_index_with_max_voltage_magnitude = 0;
	let max_voltage_magnitude = 0;

	for (let i = 0; i < theta_values.length; i++) {
		const current_theta = theta_values[i];
		const d = distance_values[i];

		const phase_shifted_reflection_real = Math.cos(current_theta) * reflection.magnitude;
		const phase_shifted_reflection_imag = Math.sin(current_theta) * reflection.magnitude;

		const zl = divideComplexNums(
			1 + phase_shifted_reflection_real,
			phase_shifted_reflection_imag,
			1 - phase_shifted_reflection_real,
			-phase_shifted_reflection_imag
		);

		const voltage_magnitude = v0_plus.magnitude * Math.sqrt(1 + reflection.magnitude * reflection.magnitude + 2 * reflection.magnitude * Math.cos(current_theta));
		if (voltage_magnitude > max_voltage_magnitude) {
			max_voltage_magnitude = voltage_magnitude;
			theta_index_with_max_voltage_magnitude = i;
		}

		constant_swr_circle.push({
			d_frac_wavelength: (d / wave_length),
			shifted_reflection_theta: current_theta * 180 / Math.PI,
			shifted_reflection_length: reflection.magnitude,
			zl,
			voltage_magnitude,
			z_magnitude: zl.magnitude * z0_magnitude // same as z0_real for a lossless line
		});

		if (Math.abs(current_theta * 180 / Math.PI) < 1e-4) {
			console.log('When the reflection is coefficient is real and positive, the normalized impedance should equal to the SWR, with both standing in the same relation to reflection coefficient: ');
			console.log('- zl.real: ', zl.real);
			console.log('- SWR: ', standing_wave_ratio);
			if (Math.abs(zl.real - standing_wave_ratio) < 1e-4) {
				console.log('confirmed!')
			}
		}
	}

	console.log('Voltage magnitude max (standing wave peak) is expected at reflection angle zero (shifted reflection is a real positive value)');
	console.log('- voltage magnitude max at angle: ', constant_swr_circle[theta_index_with_max_voltage_magnitude].shifted_reflection_theta);
	console.log('- voltage magntiude max value: ', max_voltage_magnitude);
	if (Math.abs(constant_swr_circle[theta_index_with_max_voltage_magnitude].shifted_reflection_theta) < 1e-4) {
		console.log('confirmed!');
	}
	
	console.log(constant_swr_circle);
	return constant_swr_circle;
}


globalThis.frequency = Math.pow(10, 9);
globalThis.load_impedance = {
	real: 100,
	imag: -40
}
globalThis.generator = {
	generator_distance: 1, 
	generator_voltage_real: 1, 
	generator_voltage_imag: 0.5, 
	generator_impedance_real: 50, 
	generator_impedance_imag: 0
}

// getTLWaveParams(1, 167e-9, 0, 172e-12, Math.pow(10, 9));
const tlWaveParams = getTLWaveParams(0 /* R */, 800e-9 /* L */, 0 /* G */, 100e-12 /* C */, frequency);
const reflectionParams = getTLRefelectionCoefficient(load_impedance.real, load_impedance.imag, tlWaveParams.z0_magnitude, tlWaveParams.z0_theta);
const standingWaveRatio = getStandingWaveRatio_lossless_TL(reflectionParams.reflection);
const derived_impedance_at_load = getImpedanceAtDistanceFromLoad_lossless_TL(0, reflectionParams.reflection, tlWaveParams.z0_magnitude, tlWaveParams.beta);
if (Math.abs(derived_impedance_at_load.real - load_impedance.real) < 1e-4 && Math.abs(derived_impedance_at_load.imag - load_impedance.imag) < 1e-4) {
	console.log('derived impedance at load matched set load impedance value');
}
const v0plus = get_generator_related_values_lossless_TL(
	generator.generator_distance,
	generator.generator_voltage_real,
	generator.generator_voltage_imag,
	generator.generator_impedance_real,
	generator.generator_impedance_imag,
	reflectionParams.reflection, 
	tlWaveParams.z0_magnitude, 
	tlWaveParams.beta
);
const constant_swr_circle = get_swr_circle_lossless_TL(reflectionParams.reflection, v0plus, standingWaveRatio, tlWaveParams.z0_magnitude, tlWaveParams.beta);
