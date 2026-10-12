globalThis.multiplyComplexNums = (n1_real, n1_imag, n2_real, n2_imag) => {
	return {
		real: n1_real * n2_real - n1_imag * n2_imag,
		imag: n1_real * n2_imag + n1_imag * n2_real
	}
}
globalThis.multiplyComplexNums_v2 = (n1, n2) => {
	return multiplyComplexNums(n1.real, n1.imag, n2.real, n2.imag);
}
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
globalThis.divideComplexNums_v2 = (n1, n2) => {
	return divideComplexNums(n1.real, n1.imag, n2.real, n2.imag);
}
globalThis.addComplexNums = (n1, n2) => {
	return {
		real: n1.real + n2.real,
		imag: n1.imag + n2.imag
	}
}
globalThis.subtractComplexNums = (n1, n2) => {
	return {
		real: n1.real - n2.real,
		imag: n1.imag - n2.imag
	}
}
globalThis.convert_complex_num_from_cartesian_to_polar = (real, imag) => {
	const magnitude = Math.sqrt(real * real + imag * imag);
	const theta = Math.atan2(imag, real);

	return {
		magnitude,
		theta
	}
}
globalThis.convert_complex_num_from_polar_to_cartesian = (magnitude, theta) => {
	return {
		real: magnitude * Math.cos(theta),
		imag: magnitude * Math.sin(theta)
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
	
	return constant_swr_circle;
}

globalThis.match_real_impedance_by_quarter_wave_length_lossless_TL = (z0_magnitude, quarter_line_inductance, frequency) => {
	const load_impedance_magnitude = Math.sqrt(load_impedance.real * load_impedance.real + load_impedance.imag * load_impedance.imag);
	const z02 = Math.sqrt(z0_magnitude * load_impedance_magnitude);
	const beta2 = 2 * Math.PI * frequency * quarter_line_inductance / z02;
	const wave_length = 2 * Math.PI / beta2;
	const quarter_wave_length = wave_length / 4;
	
	const quarter_wave_line_reflection_params = getTLRefelectionCoefficient(load_impedance.real, load_impedance.imag, z02, 0);

	const z_in_quarter_wave_line = getImpedanceAtDistanceFromLoad_lossless_TL(quarter_wave_length, quarter_wave_line_reflection_params.reflection, z02, beta2);
	console.log('z_in_quarter_wave_line: ', z_in_quarter_wave_line.magnitude);
	console.log(' - expected to match: ', z0_magnitude);
	if (Math.abs(z_in_quarter_wave_line.magnitude - z0_magnitude) < 1e-4) {
		console.log('confirmed!')
	}
}

globalThis.match_impedance_by_quarter_wave_length_plus_reactance_cancelling_segment_lossless_TL = (reflection, z0_magnitude, beta, quarter_line_inductance, frequency) => {
	// theta = reflection.theta - 2 * beta * d = 0;
	let d_voltage_max = reflection.theta / (2 * beta);
	if (d_voltage_max < 0) {
		d_voltage_max = (reflection.theta + 2 * Math.PI) / (2 * beta);
	}

	// theta = reflection.theta - 2 * beta * d = -Math.PI or Math.PI
	let d_voltage_min = 0;
	if (Math.abs(reflection.theta - Math.PI) > 1e-4 && Math.abs(reflection.theta + Math.PI) > 1e-4) {
		d_voltage_min = (reflection.theta + Math.PI) / (2 * beta);
		if (d_voltage_min < 0) {
			d_voltage_min = (reflection.theta + 3 * Math.PI) / (2 * beta);
		}
	}

	const distance_to_quarter_wave_line_from_load = d_voltage_max < d_voltage_min ? d_voltage_max : d_voltage_min;
	const z_in_from_post_quarter_wave_line_towards_load = getImpedanceAtDistanceFromLoad_lossless_TL(distance_to_quarter_wave_line_from_load, reflection, z0_magnitude, beta);

	console.log('At distances d_voltage_max and d_voltage_min, z_in towards load is real only');
	console.log(' - z_in_from_post_quarter_wave_line_towards_load.imag: ', z_in_from_post_quarter_wave_line_towards_load.imag);
	if (Math.abs(z_in_from_post_quarter_wave_line_towards_load.imag) < 1e-4) {
		console.log('confirmed!');
	}

	const z02 = Math.sqrt(z0_magnitude * z_in_from_post_quarter_wave_line_towards_load.real);
	const beta2 = 2 * Math.PI * frequency * quarter_line_inductance / z02;
	const wave_length = 2 * Math.PI / beta2;
	const quarter_wave_length = wave_length / 4;

	const quarter_wave_line_reflection_params = getTLRefelectionCoefficient(
		z_in_from_post_quarter_wave_line_towards_load.real, 
		z_in_from_post_quarter_wave_line_towards_load.imag, 
		z02, 
		0
	);	

	const z_in_quarter_wave_line = getImpedanceAtDistanceFromLoad_lossless_TL(quarter_wave_length, quarter_wave_line_reflection_params.reflection, z02, beta2);
	console.log('z_in_quarter_wave_line: ', z_in_quarter_wave_line.magnitude);
	console.log(' - expected to match: ', z0_magnitude);
	if (Math.abs(z_in_quarter_wave_line.real - z0_magnitude) < 1e-4) {
		console.log('confirmed!')
	}
}

globalThis.match_impedance_by_series_reactive_element_lossless_TL = (reflection, z0_magnitude, beta, frequency) => {
	const reflection_theta_real_z0 = Math.acos(reflection.magnitude);
	const reflection_theta_2_real_z0 = -reflection_theta_real_z0;

	// reflection.theta - 2 * beta * d = reflection_theta_real_z0
	let distance_real_z0 = (reflection.theta - reflection_theta_real_z0) / (2 * beta);
	if (distance_real_z0 < 0) {
		distance_real_z0 += (2 * Math.PI / (2 * beta));
	}
	let distance2_real_z0 = (reflection.theta - reflection_theta_2_real_z0) / (2 * beta);
	if (distance2_real_z0 < 0) {
		distance2_real_z0 += (2 * Math.PI / (2 * beta));
	}

	const distances = [distance_real_z0];
	if (Math.abs(distance_real_z0 - distance2_real_z0) > 1e-4) {
		distances.push(distance2_real_z0);
	}

	const impedance_matching_series_options = [];
	distances.forEach((distance_real_z0) => {
		const z_at_distance_real_z0 = getImpedanceAtDistanceFromLoad_lossless_TL(distance_real_z0, reflection, z0_magnitude, beta);
		impedance_matching_series_options.push({
			distance_real_z0,
			z_at_distance_real_z0
		});
		
		const current_option = impedance_matching_series_options.at(-1);
		if (Math.abs(z_at_distance_real_z0.imag) < 1e-4) {
			current_option.element = 'none - already matched';
			return;
		}
		if (z_at_distance_real_z0.imag > 0) {
			current_option.element = 'capacitor';
			current_option.capacitance = 1 / (2 * Math.PI * frequency * z_at_distance_real_z0.imag);
		} else {
			current_option.element = 'inductor';
			current_option.inductance = -z_at_distance_real_z0.imag / (2 * Math.PI * frequency);
		}
	});

	return impedance_matching_series_options;
}

globalThis.match_impedance_by_shunt_reactive_element_lossless_TL = (reflection, z0_magnitude, beta, frequency) => {
	const wave_length = 2 * Math.PI / beta;

	const reflection_theta_real_z0 = Math.acos(reflection.magnitude);
	const reflection_theta_2_real_z0 = -reflection_theta_real_z0;

	// reflection.theta - 2 * beta * d = reflection_theta_real_z0
	let distance_real_z0 = (reflection.theta - reflection_theta_real_z0) / (2 * beta);
	if (distance_real_z0 < 0) {
		distance_real_z0 += (2 * Math.PI / (2 * beta));
	}
	let distance2_real_z0 = (reflection.theta - reflection_theta_2_real_z0) / (2 * beta);
	if (distance2_real_z0 < 0) {
		distance2_real_z0 += (2 * Math.PI / (2 * beta));
	}

	const distances = [distance_real_z0];
	if (Math.abs(distance_real_z0 - distance2_real_z0) > 1e-4) {
		distances.push(distance2_real_z0);
	}

	const impedance_matching_shunt_options = [];
	distances.forEach((staging_distance_real_z0) => {
		const z_at_distance_real_z0 = getImpedanceAtDistanceFromLoad_lossless_TL(staging_distance_real_z0, reflection, z0_magnitude, beta);

		const actual_distance = staging_distance_real_z0 - (wave_length / 4) < 0 ? staging_distance_real_z0 + (wave_length / 4) : staging_distance_real_z0 - (wave_length / 4);
		
		const normalized_y_at_actual_distance = {
			real: z_at_distance_real_z0.real / z0_magnitude,
			imag: z_at_distance_real_z0.imag / z0_magnitude,
		}

		console.log('Normalized real admitance has to be 1 at the target point');
		if (Math.abs(normalized_y_at_actual_distance.real - 1) < 1e-4) {
			console.log('confirmed!');
		};

		impedance_matching_shunt_options.push({
			actual_distance,
			normalized_y_at_actual_distance
		});

		
		const current_option = impedance_matching_shunt_options.at(-1);
		if (Math.abs(normalized_y_at_actual_distance.imag) < 1e-4) {
			current_option.element = 'none - already matched';
			return;
		}

		const B = normalized_y_at_actual_distance.imag / z0_magnitude;
		const X = -1 / B;

		if (X > 0) {
			current_option.element = 'capacitor';
			current_option.capacitance = 1 / (2 * Math.PI * frequency * X);
		} else {
			current_option.element = 'inductor';
			current_option.inductance = -X / (2 * Math.PI * frequency);
		}
	});

	return impedance_matching_shunt_options;
}

globalThis.find_thevenin_equivalent_circuit = (generator, reflection, z0_magnitude, beta) => {
	const tl1_length = generator.generator_tl1_length;
	const tl2_length = generator.generator_tl2_length;

	// Thevenin equivalent TL2 and load

	const z_looking_in_tl2 = getImpedanceAtDistanceFromLoad_lossless_TL(tl2_length, reflection, z0_magnitude, beta);
	const tl2_and_load_equivalent = {
		z_real: z_looking_in_tl2.real,
		z_imag: z_looking_in_tl2.imag,
		voltage_real: 0,
		voltage_imag: 0
	};
	// console.log('z_looking_in_tl2:', z_looking_in_tl2);

	// Thevenin equivalent TL1 and generator

	// z_th
	const reflectionParamsLookingIntoGenerator = getTLRefelectionCoefficient(
		generator.generator_impedance_real, 
		generator.generator_impedance_imag, 
		z0_magnitude, 
		0
	);
	const z_looking_into_tl1_towards_generator = getImpedanceAtDistanceFromLoad_lossless_TL(
		tl1_length, 
		reflectionParamsLookingIntoGenerator.reflection, 
		z0_magnitude, 
		beta
	);
	// console.log('z_looking_into_tl1_towards_generator:', z_looking_into_tl1_towards_generator);

	// open circuited voltage

	let tl1_and_generator_equivalent;
	if (tl1_length === 0) {
		tl1_and_generator_equivalent = {
			z_real: generator.generator_impedance_real,
			z_imag: generator.generator_impedance_imag,
			voltage_real: generator.generator_voltage_real,
			voltage_imag: generator.generator_voltage_imag
		};
	} else {
		const openCircuitedReflection = {
			magnitude: 1,
			theta: 0,
			real: 1,
			imag: 0
		};

		const v0_plus = get_generator_related_values_lossless_TL(
			tl1_length, 
			generator.generator_voltage_real, 
			generator.generator_voltage_imag, 
			generator.generator_impedance_real, 
			generator.generator_impedance_imag,
			openCircuitedReflection,
			z0_magnitude,
			beta
		);
		// console.log('v0_plus:', v0_plus);

		// distance is zero as the distance is defined from load towards generator, and zero is the load
		const ratio = get_voltage_as_v0plus_ratio_at_distance_from_load_lossless_TL(0, openCircuitedReflection, beta);
		// console.log('v_v0plus_ratio_at_load_end_of_tl1: ', ratio);
		
		tl1_and_generator_equivalent = {
			z_real: z_looking_into_tl1_towards_generator.real,
			z_imag: z_looking_into_tl1_towards_generator.imag,
			voltage_real: (v0_plus.real * ratio.v_to_v0plus_ratio_real - v0_plus.imag * ratio.v_to_v0plus_ratio_imag),
			voltage_imag: (v0_plus.real * ratio.v_to_v0plus_ratio_imag + v0_plus.imag * ratio.v_to_v0plus_ratio_real)
		};
	}
	// console.log('tl1_and_generator_equivalent:', tl1_and_generator_equivalent);

	return {
		tl1_and_generator_equivalent,
		tl2_and_load_equivalent
	}
}

globalThis.get_parallel_series_parallel_equivalent_z = (
	two_port_z_parallel_pre_series,
	two_port_z_series,
	two_port_z_parallel_post_series,
	load_z_parallel
) => {
	const z_post_series_numerator = multiplyComplexNums(
		two_port_z_parallel_post_series.real,
		two_port_z_parallel_post_series.imag,
		load_z_parallel.z_real,
		load_z_parallel.z_imag,
	);

	const z_post_series = divideComplexNums(
		z_post_series_numerator.real, 
		z_post_series_numerator.imag,
		two_port_z_parallel_post_series.real + load_z_parallel.z_real,
		two_port_z_parallel_post_series.imag + load_z_parallel.z_imag
	);

	const series_z_plus_parallel_z = {
		real: two_port_z_series.real + z_post_series.real,
		imag: two_port_z_series.imag + z_post_series.imag
	};

	const z_pre_series_numerator = multiplyComplexNums(
		two_port_z_parallel_pre_series.real,
		two_port_z_parallel_pre_series.imag,
		series_z_plus_parallel_z.real,
		series_z_plus_parallel_z.imag
	);

	const z_pre_two_port = divideComplexNums(
		z_pre_series_numerator.real, 
		z_pre_series_numerator.imag,
		two_port_z_parallel_pre_series.real + series_z_plus_parallel_z.real,
		two_port_z_parallel_pre_series.imag + series_z_plus_parallel_z.imag
	);

	return z_pre_two_port;
}

globalThis.get_voltage_across_load_with_parallel_series_parallel_two_port_z = (
	generator_current,
	voltage_pre_two_port,
	two_port_z_parallel_pre_series, 
	two_port_z_series, 
	two_port_z_parallel_post_series,
	z0_magnitude
) => {
	const current_down_first_parallel = divideComplexNums(
		voltage_pre_two_port.real,
		voltage_pre_two_port.imag,
		two_port_z_parallel_pre_series.real,
		two_port_z_parallel_pre_series.imag
	);

	const current_remaining_for_series = {
		real: generator_current.real - current_down_first_parallel.real,
		imag: generator_current.imag - current_down_first_parallel.imag
	};

	const voltage_drop_across_series = multiplyComplexNums(
		two_port_z_series.real,
		two_port_z_series.imag,
		current_remaining_for_series.real,
		current_remaining_for_series.imag
	);

	const voltage_across_load = {
		real: voltage_pre_two_port.real - voltage_drop_across_series.real,
		imag: voltage_pre_two_port.imag - voltage_drop_across_series.imag
	}
	// console.log('voltage_across_load', voltage_across_load);

	return voltage_across_load;
}

globalThis.find_pre_two_port_impedance_current_voltage = (tl_and_generator_equivalent, z_pre_two_port) => {
	const total_z = {
		real: tl_and_generator_equivalent.z_real + z_pre_two_port.real,
		imag: tl_and_generator_equivalent.z_imag + z_pre_two_port.imag
	};

	const generator_current = divideComplexNums(
		tl_and_generator_equivalent.voltage_real,
		tl_and_generator_equivalent.voltage_imag,
		total_z.real,
		total_z.imag			
	);

	const voltageDropFromGeneratorToTwoPort = multiplyComplexNums(
		generator_current.real,
		generator_current.imag,
		tl_and_generator_equivalent.z_real,
		tl_and_generator_equivalent.z_imag,
	);

	const voltage_pre_two_port = {
		real: tl_and_generator_equivalent.voltage_real - voltageDropFromGeneratorToTwoPort.real,
		imag: tl_and_generator_equivalent.voltage_imag - voltageDropFromGeneratorToTwoPort.imag		
	};

	const z_pre_two_port_alternative_calculation = divideComplexNums(
		voltage_pre_two_port.real,
		voltage_pre_two_port.imag,
		generator_current.real,
		generator_current.imag
	);

	return {
		voltage_pre_two_port,
		generator_current,
		z_pre_two_port: z_pre_two_port_alternative_calculation
	}
}

globalThis.find_S_params = (
	generator,
	two_port_z_parallel_pre_series, 
	two_port_z_series, 
	two_port_z_parallel_post_series,	
	z0_magnitude, 
	beta
) => {
	const zero_reflection_at_load = {
		real: 0,
		imag: 0,
		magnitude: 0,
		theta: 0
	}
	const thevenin_equivalent_terminated_load = find_thevenin_equivalent_circuit(generator, zero_reflection_at_load, z0_magnitude, beta);

	const tl1_and_generator_equivalent = thevenin_equivalent_terminated_load.tl1_and_generator_equivalent;
	const tl2_and_load_equivalent = thevenin_equivalent_terminated_load.tl2_and_load_equivalent;

	const z_pre_two_port = get_parallel_series_parallel_equivalent_z(
		two_port_z_parallel_pre_series,
		two_port_z_series,
		two_port_z_parallel_post_series,
		tl2_and_load_equivalent
	);	

	const pre_two_port_impedance_current_voltage = find_pre_two_port_impedance_current_voltage(tl1_and_generator_equivalent, z_pre_two_port);
	const generator_current = pre_two_port_impedance_current_voltage.generator_current;
	const voltage_on_left_of_two_port = pre_two_port_impedance_current_voltage.voltage_pre_two_port;
	const z_pre_two_port_alternative_calculation = pre_two_port_impedance_current_voltage.z_pre_two_port;

	const S11 = getTLRefelectionCoefficient(z_pre_two_port.real, z_pre_two_port.imag, z0_magnitude, 0).reflection;
	const S11_indirect = getTLRefelectionCoefficient(z_pre_two_port_alternative_calculation.real, z_pre_two_port_alternative_calculation.imag, z0_magnitude, 0).reflection;
	// console.log('S11', S11);

	console.log('S11 values should match across the two computations');
	if (Math.abs(S11.real - S11_indirect.real) < 1e-4 && Math.abs(S11.imag - S11_indirect.imag) < 1e-4) {
		console.log('confirmed');
	}

	const voltage_across_load = get_voltage_across_load_with_parallel_series_parallel_two_port_z(
		generator_current,
		voltage_on_left_of_two_port,
		two_port_z_parallel_pre_series, 
		two_port_z_series, 
		two_port_z_parallel_post_series,
		z0_magnitude
	);

	const tl1_thevenin_z_polar = convert_complex_num_from_cartesian_to_polar(
		tl1_and_generator_equivalent.z_real,
		tl1_and_generator_equivalent.z_imag
	);

	const sqrt_tl1_thevenin_z = convert_complex_num_from_polar_to_cartesian(
		Math.sqrt(tl1_thevenin_z_polar.magnitude),
		tl1_thevenin_z_polar.theta / 2	
	);

	let S21 = multiplyComplexNums(
		2 * sqrt_tl1_thevenin_z.real / Math.sqrt(z0_magnitude),
		2 * sqrt_tl1_thevenin_z.imag / Math.sqrt(z0_magnitude),
		voltage_across_load.real,
		voltage_across_load.imag
	);

	S21 = divideComplexNums(
		S21.real,
		S21.imag,
		tl1_and_generator_equivalent.voltage_real,
		tl1_and_generator_equivalent.voltage_imag
	);
	// console.log('S21', S21);

	const z_pre_two_port_from_tl2_side = get_parallel_series_parallel_equivalent_z(
		two_port_z_parallel_post_series,
		two_port_z_series,
		two_port_z_parallel_pre_series,
		{
			z_real: z0_magnitude,
			z_imag: 0
		}
	);

	const S22 = getTLRefelectionCoefficient(z_pre_two_port_from_tl2_side.real, z_pre_two_port_from_tl2_side.imag, z0_magnitude, 0).reflection;
	// console.log('S22', S22);

	// load now conceptually on the tl1 side
	const conceptual_generator_at_load = {
		generator_distance: generator.generator_distance,
		generator_tl1_length: generator.generator_tl2_length,
		generator_tl2_length: generator.generator_tl1_length,
		generator_voltage_real: 1, 
		generator_voltage_imag: 0, 
		generator_impedance_real: z0_magnitude, 
		generator_impedance_imag: 0
	}

	// zero_reflection_at_load is now at the original generator's side
	const thevenin_equivalent_with_generator_on_tl2_side = find_thevenin_equivalent_circuit(conceptual_generator_at_load, zero_reflection_at_load, z0_magnitude, beta);
	const tl2_and_generator_equivalent = thevenin_equivalent_with_generator_on_tl2_side.tl1_and_generator_equivalent;	

	const pre_two_port_impedance_current_voltage_tl2_side = find_pre_two_port_impedance_current_voltage(tl2_and_generator_equivalent, z_pre_two_port_from_tl2_side);
	const generator_current_tl2_side = pre_two_port_impedance_current_voltage_tl2_side.generator_current;
	const voltage_on_right_of_two_port = pre_two_port_impedance_current_voltage_tl2_side.voltage_pre_two_port;
	const z_pre_two_port_alternative_calculation_from_tl2_side = pre_two_port_impedance_current_voltage_tl2_side.z_pre_two_port;

	const voltage_across_load_on_tl1_side = get_voltage_across_load_with_parallel_series_parallel_two_port_z(
		generator_current_tl2_side,
		voltage_on_right_of_two_port,
		two_port_z_parallel_post_series, 
		two_port_z_series, 
		two_port_z_parallel_pre_series,
		z0_magnitude
	);

	const S12 = divideComplexNums(
		2 * voltage_across_load_on_tl1_side.real,
		2 * voltage_across_load_on_tl1_side.imag,
		tl2_and_generator_equivalent.voltage_real,
		tl2_and_generator_equivalent.voltage_imag
	);
	// console.log('S12', S12);

	return { S11, S12, S21, S22 }
}

globalThis.findSignalFlowNodeValues = (generator, load, S11, S21, S12, S22, z0_magnitude, beta) => {	
	const source_voltage = {
		real: generator.generator_voltage_real,
		imag: generator.generator_voltage_imag
	}
	const source_impedance = {
		real: generator.generator_impedance_real,
		imag: generator.generator_impedance_imag
	}

	const tl1_length = generator.generator_tl1_length;
	const tl2_length = generator.generator_tl2_length;

	// gamma_in = b1 / a1 (only when load matched with TL2)
	
	// b2 * gamma_l = a2
	// b2 = a2 / gamma_l
	
	// b2 = S21 * a1 + S22 * a2	
	// a2 / gamma_l = S21 * a1 + S22 * a2
	// a2 * (1/gamma_l - S22) = S21 * a1
	// a2 = S21 * a1 / (1/gamma_l - S22)
	// a2 = S21 * a1 * gamma_l / (1 - S22 * gamma_l)

	// b1 = S11 * a1 + S12 * a2
	// b1 = S11 * a1 + S12 * S21 * a1 * gamma_l / (1 - S22 * gamma_l)
	// b1 / a1 = S11 + S12 * S21 * gamma_l / (1 - S22 * gamma_l)

	const relfection_load = getTLRefelectionCoefficient(load.real, load.imag, z0_magnitude, 0).reflection;
	let reflection_load_phase_shifted = {
		magnitude: relfection_load.magnitude,
		theta: relfection_load.theta - (2 * beta * tl2_length)
	}
	reflection_load_phase_shifted = convert_complex_num_from_polar_to_cartesian(reflection_load_phase_shifted.magnitude, reflection_load_phase_shifted.theta);

	let numerator = multiplyComplexNums_v2(multiplyComplexNums_v2(S12, S21), reflection_load_phase_shifted);
	let denominator = subtractComplexNums(
		{
			real: 1,
			imag: 0
		},
		multiplyComplexNums_v2(S22, reflection_load_phase_shifted)
	);

	const gamma_in_b1_to_a1_ratio = addComplexNums(
		S11,
		divideComplexNums(
			numerator.real,
			numerator.imag,
			denominator.real,
			denominator.imag
		)
	);
	// console.log('gamma_in_b1_to_a1_ratio', gamma_in_b1_to_a1_ratio);

	// gamma_out = b2 / a2 (only when matched Zs in place)
	
	// b1 = S12 * a2 + S11 * a1
	// b1 * gamma_s = a1
	// b1 = a1 / gamma_s
	
	// a1 / gamma_s = S12 * a2 + S11 * a1
	// (1/gamma_s - S11) * a1 = S12 * a2
	// a1 = S12 * a2 / (1/gamma_s - S11)


	// b2 = S21 * a1 + S22 * a2
	// b2 = S21 * S12 * a2 / (1/gamma_s - S11) + S22 * a2

	// b2 / a2 = S21 * S12 / (1/gamma_s - S11) + S22
	// b2 / a2 = S21 * S12 * gamma_s / (1 - S11 * gammas_) + S22 // last line * gamma_s

	const relfection_generator_impedance = getTLRefelectionCoefficient(source_impedance.real, source_impedance.imag, z0_magnitude, 0).reflection;
	relfection_generator_impedance.theta -= (2 * beta * tl1_length);
	const relfection_generator_impedance_phase_shifted = convert_complex_num_from_polar_to_cartesian(relfection_generator_impedance.magnitude, relfection_generator_impedance.theta);

	numerator = multiplyComplexNums_v2(
		multiplyComplexNums_v2(S21, S12), 
		relfection_generator_impedance_phase_shifted
	);
	denominator = subtractComplexNums(
		{real: 1, imag: 0}, 
		multiplyComplexNums_v2(S11, relfection_generator_impedance_phase_shifted)
	);
	const gamma_out_b2_to_a2_ratio = addComplexNums(
		divideComplexNums(
			numerator.real,
			numerator.imag,
			denominator.real,
			denominator.imag
		),
		S22
	);
	// console.log('gamma_out_b2_to_a2_ratio', gamma_out_b2_to_a2_ratio);

	// what voltage a Thevenin source sends into a Z0 impedance in series with Zth
	const thevenin_res = find_thevenin_equivalent_circuit(generator, 1, z0_magnitude, beta);
	const tl1_and_generator_equivalent = thevenin_res.tl1_and_generator_equivalent;
	const bs = divideComplexNums(
		tl1_and_generator_equivalent.voltage_real * Math.sqrt(z0_magnitude),
		tl1_and_generator_equivalent.voltage_imag * Math.sqrt(z0_magnitude),
		tl1_and_generator_equivalent.z_real + z0_magnitude,
		tl1_and_generator_equivalent.z_imag
	);
	const bs_at_tl1_length = bs;

	// a1 = bs + gamma_s * b1
	// b1 / a1 = gamma_in
	// a1 = bs + gamma_s * a1 * gamma_in
	// (1 - gamma_s * gamma_in) * a1 = bs
	
	denominator = multiplyComplexNums_v2(relfection_generator_impedance_phase_shifted, gamma_in_b1_to_a1_ratio);
	const a1 = divideComplexNums(
		bs_at_tl1_length.real,
		bs_at_tl1_length.imag,
		1 - denominator.real,
		-denominator.imag
	);
	// console.log('a1', a1);

	// b1 = gamma_in_b1_to_a1_ratio * a1
	const b1 = multiplyComplexNums_v2(gamma_in_b1_to_a1_ratio, a1);
	// console.log('b1', b1);

	/*
		Correct but not ideal:
		a2 = b2 * gamma_l
		a2 * S12 = b1 - a1 * S11
		b2 * gamma_l * S12 = b1 - a1 * S11
		b2 = (b1 - a1 * S11) / (gamma_l * S12)
	*/
	/*
		b2 = a1 * S21 + a2 * S22
		a2 = gamma_l * b2

		b2 = a1 * S21 + gamma_l * b2 * S22
		(1 - gamma_l * S22) * b2 = a1 * S21
		b2 = a1 * S21 / (1 - gamma_l * S22)
	*/

	numerator = multiplyComplexNums_v2(S21, a1);
	denominator = subtractComplexNums(
		{
			real: 1,
			imag: 0
		},
		multiplyComplexNums_v2(reflection_load_phase_shifted, S22)
	)
	const b2 = divideComplexNums(
		numerator.real,
		numerator.imag,
		denominator.real,
		denominator.imag
	);
	// console.log('b2', b2);

	// a2 = b2 * gamma_l
	const a2 = multiplyComplexNums_v2(b2, reflection_load_phase_shifted);
	// console.log('a2', a2);

	return {
		a1, a2, b1, b2, 
		bs, bs_at_tl1_length, 
		relfection_generator_impedance_phase_shifted, reflection_load_phase_shifted, 
		gamma_in_b1_to_a1_ratio, gamma_out_b2_to_a2_ratio
	};
}

globalThis.getRLCValsForImpedance = (impedance, frequency) => {
	const resistor = impedance.real;
	let capacitor = 0;
	let inductor = 0;
	if (Math.abs(impedance.imag) > 1e-4) {
		if (impedance.imag > 0) {
			inductor = impedance.imag / (2 * Math.PI * frequency);
		}
		if (impedance.imag < 0) {
			capacitor = 1 / (-2 * Math.PI * frequency * impedance.imag)
		}
	}
	return {
		resistor,
		capacitor,
		inductor
	}
}

globalThis.get_generator_and_load_thevenin_circuit_components = (generator, load, frequency, z0_magnitude, beta) => {
	const relfection_load = getTLRefelectionCoefficient(load.real, load.imag, z0_magnitude, 0).reflection;
	const thevenin_equivalent = find_thevenin_equivalent_circuit(generator, relfection_load, z0_magnitude, beta);
	
	const tl1_and_generator_equivalent = thevenin_equivalent.tl1_and_generator_equivalent;
	const tl2_and_load_equivalent = thevenin_equivalent.tl2_and_load_equivalent;
	// console.log('tl2_and_load_equivalent', tl2_and_load_equivalent);

	const source_RLC = getRLCValsForImpedance({
		real: tl1_and_generator_equivalent.z_real,
		imag: tl1_and_generator_equivalent.z_imag,
	}, frequency);
	const load_RLC = getRLCValsForImpedance({
		real: tl2_and_load_equivalent.z_real,
		imag: tl2_and_load_equivalent.z_imag,		
	}, frequency);

	// console.log('source_RLC', source_RLC);
	// console.log('load_RLC', load_RLC);

	const source_voltage = {
		real: tl1_and_generator_equivalent.voltage_real,
		imag: tl1_and_generator_equivalent.voltage_imag,
		...convert_complex_num_from_cartesian_to_polar(tl1_and_generator_equivalent.voltage_real, tl1_and_generator_equivalent.voltage_imag)
	}
	source_voltage.theta_degrees = source_voltage.theta * 180 / Math.PI;
	// console.log(source_voltage);
}

globalThis.get_s_params_from_simulated_circuit = (generator_side_sim_vals, load_side_sim_vals, /*generator, load_impedance, frequency,*/ z0_magnitude/*, beta*/, reverse_setup) => {
	// important: variable names and comments are geared towards the non-reversed case, but the reverse case is simply a mirror image of the other	
	
	const generator_side_impedance_at_distance_l1 = divideComplexNums_v2(generator_side_sim_vals.voltage, generator_side_sim_vals.current);
	
	let S11, S22;
	const reflection_at_port_generator_side = divideComplexNums(
		generator_side_impedance_at_distance_l1.real - z0_magnitude,
		generator_side_impedance_at_distance_l1.imag,
		generator_side_impedance_at_distance_l1.real + z0_magnitude,
		generator_side_impedance_at_distance_l1.imag,		
	);
	if (!reverse_setup) {
		S11 = reflection_at_port_generator_side;
		console.log('sim based S11', S11);
	} else {
		S22 = reflection_at_port_generator_side;
		console.log('sim based S22', S22);
	}

	// (1 + gamma) * a1 = a1 + b1 = generator_side_sim_vals.voltage / sqrt(z0)
	const normalized_generator_side_voltage = {
		real: generator_side_sim_vals.voltage.real / Math.sqrt(z0_magnitude),
		imag: generator_side_sim_vals.voltage.imag / Math.sqrt(z0_magnitude),		
	}
	const a1 = divideComplexNums(
		normalized_generator_side_voltage.real,
		normalized_generator_side_voltage.imag,
		reflection_at_port_generator_side.real + 1,
		reflection_at_port_generator_side.imag
	);

	const load_side_impedance_at_distance_l2 = divideComplexNums_v2(
		multiplyComplexNums_v2(
			load_side_sim_vals.voltage,
			{real: -1, imag: 0}
		),
		load_side_sim_vals.current
	);
	const load_side_reflection = divideComplexNums(
		load_side_impedance_at_distance_l2.real - z0_magnitude,
		load_side_impedance_at_distance_l2.imag,
		load_side_impedance_at_distance_l2.real + z0_magnitude,
		load_side_impedance_at_distance_l2.imag,		
	);

	// (1 + gamma) * b2 = b2 + a2 = load_side_sim_vals.voltage / sqrt(z0)
	const normalized_load_side_voltage = {
		real: load_side_sim_vals.voltage.real / Math.sqrt(z0_magnitude),
		imag: load_side_sim_vals.voltage.imag / Math.sqrt(z0_magnitude),		
	}
	const b2 = divideComplexNums(
		normalized_load_side_voltage.real,
		normalized_load_side_voltage.imag,
		load_side_reflection.real + 1,
		load_side_reflection.imag
	);

	let S21, S12;
	const b2_to_a1_ratio = divideComplexNums_v2(b2, a1);
	if (!reverse_setup) {
		S21 = b2_to_a1_ratio;
		console.log('sim based S21', S21);

		return { S11, S21 };
	} else {
		S12 = b2_to_a1_ratio;
		console.log('sim based S12', S12);

		return { S22, S12 };
	}
}

globalThis.convert_signal_flow_node_vals_to_voltage_current_vals = (signalFlowVals, z0_magnitude) => {
	const convert_voltage = (signal_node) => {
		const voltage = {
			real: signal_node.real * Math.sqrt(z0_magnitude),
			imag: signal_node.imag * Math.sqrt(z0_magnitude),
		}
		const voltage_polar = convert_complex_num_from_cartesian_to_polar(voltage.real, voltage.imag);
		voltage.magnitude = voltage_polar.magnitude;
		voltage.theta = voltage_polar.theta;

		return voltage;
	}

	const voltages =  {
		a1_voltage: convert_voltage(signalFlowVals.a1),
		b1_voltage: convert_voltage(signalFlowVals.b1),
		a2_voltage: convert_voltage(signalFlowVals.a2),
		b2_voltage: convert_voltage(signalFlowVals.b2)
	}

	voltages.generator_side_total = {
		real: voltages.a1_voltage.real + voltages.b1_voltage.real,
		imag: voltages.a1_voltage.imag + voltages.b1_voltage.imag,
	}
	const voltage_generator_side_total_polar = convert_complex_num_from_cartesian_to_polar(voltages.generator_side_total.real, voltages.generator_side_total.imag);
	voltages.generator_side_total.magnitude = voltage_generator_side_total_polar.magnitude;
	voltages.generator_side_total.theta = voltage_generator_side_total_polar.theta;

	voltages.load_side_total = {
		real: voltages.a2_voltage.real + voltages.b2_voltage.real,
		imag: voltages.a2_voltage.imag + voltages.b2_voltage.imag,
	}
	const voltage_load_side_total = convert_complex_num_from_cartesian_to_polar(voltages.load_side_total.real, voltages.load_side_total.imag);
	voltages.load_side_total.magnitude = voltage_load_side_total.magnitude;
	voltages.load_side_total.theta = voltage_load_side_total.theta;	

	return voltages;
}

globalThis.match_gammaIn_at_generator = (signalFlowVals, generator, frequency, z0_magnitude, beta) => {
	const tl1_length = generator.generator_tl1_length;

	const gamma_in = signalFlowVals.gamma_in_b1_to_a1_ratio;
	const gamma_in_polar = convert_complex_num_from_cartesian_to_polar(gamma_in.real, gamma_in.imag);
	gamma_in.magnitude = gamma_in_polar.magnitude;
	gamma_in.theta = gamma_in_polar.theta;

	const conjugate_gamma_in = {
		real: gamma_in.real,
		imag: -gamma_in.imag
	}
	const conjugate_gamma_in_polar = convert_complex_num_from_cartesian_to_polar(gamma_in.real, -gamma_in.imag);
	conjugate_gamma_in.magnitude = conjugate_gamma_in_polar.magnitude;
	conjugate_gamma_in.theta = conjugate_gamma_in_polar.theta;

	// this function just converts reflection to impedance (distance of 0 for not rolling back the phase)
	const conjugate_impedance_at_tl1_length = getImpedanceAtDistanceFromLoad_lossless_TL(
		0, 
		conjugate_gamma_in, 
		z0_magnitude, 
		beta
	);

	// gamma_in at the generator
	const theta_shift = 2 * beta * tl1_length;
	const gamma_in_at_generator = {
		magnitude: gamma_in.magnitude,
		theta: gamma_in.theta - theta_shift,
		...convert_complex_num_from_polar_to_cartesian(gamma_in.magnitude, gamma_in.theta - theta_shift)
	}

	const conjugate_gamma_in_at_generator = {
		real: gamma_in_at_generator.real,
		imag: -gamma_in_at_generator.imag,
		...convert_complex_num_from_cartesian_to_polar(gamma_in_at_generator.real, -gamma_in_at_generator.imag)
	};

	// this function just converts reflection to impedance (distance of 0 for not rolling back the phase)
	const conjugate_impedance_at_generator = getImpedanceAtDistanceFromLoad_lossless_TL(
		0, 
		conjugate_gamma_in_at_generator, 
		z0_magnitude, 
		beta
	);

	return {
		conjugate_impedance_at_tl1_length,
		conjugate_impedance_at_generator
	}
}

globalThis.match_gammaOut_at_load = (signalFlowVals, generator, frequency, z0_magnitude, beta) => {
	const tl2_length = generator.generator_tl2_length; 	// distance from load to port

	const gamma_out = signalFlowVals.gamma_out_b2_to_a2_ratio;
	const gamma_out_polar = convert_complex_num_from_cartesian_to_polar(gamma_out.real, gamma_out.imag);
	gamma_out.magnitude = gamma_out_polar.magnitude;
	gamma_out.theta = gamma_out_polar.theta;

	const conjugate_gamma_out = {
		real: gamma_out.real,
		imag: -gamma_out.imag
	}
	const conjugate_gamma_out_polar = convert_complex_num_from_cartesian_to_polar(gamma_out.real, -gamma_out.imag);
	conjugate_gamma_out.magnitude = conjugate_gamma_out_polar.magnitude;
	conjugate_gamma_out.theta = conjugate_gamma_out_polar.theta;

	const conjugate_impedance_at_tl2_length = getImpedanceAtDistanceFromLoad_lossless_TL(
		0, // at port
		conjugate_gamma_out, 
		z0_magnitude, 
		beta
	);

	// gamma_out at the load
	const theta_shift = 2 * beta * tl2_length;
	const gamma_out_at_load = {
		magnitude: gamma_out.magnitude,
		theta: gamma_out.theta - theta_shift,
		...convert_complex_num_from_polar_to_cartesian(gamma_out.magnitude, gamma_out.theta - theta_shift)
	}

	const conjugate_gamma_out_at_load = {
		real: gamma_out_at_load.real,
		imag: -gamma_out_at_load.imag,
		...convert_complex_num_from_cartesian_to_polar(gamma_out_at_load.real, -gamma_out_at_load.imag)
	};

	const conjugate_impedance_at_load = getImpedanceAtDistanceFromLoad_lossless_TL(
		0, 
		conjugate_gamma_out_at_load, 
		z0_magnitude, 
		beta
	);

	return {
		conjugate_impedance_at_tl2_length,
		conjugate_impedance_at_load
	}	
}

globalThis.find_LC_components_to_obtain_target_impedance = (target_impedance, fixed_resistor, frequency) => {
	const R_squared = fixed_resistor * fixed_resistor;
	const denominator = (target_impedance.real * target_impedance.real + target_impedance.imag * target_impedance.imag);
	const G = target_impedance.real / denominator;
	const B = -target_impedance.imag / denominator;

	const matching_components = [];

	let x1 = 0;
	let x2 = 0;

	// G * R^2 + G * x1^2 = R
	// x1^2 = (R - G * R^2) / G
	let sqrtArg = (fixed_resistor - G * R_squared) / G;

	if (sqrtArg < 0) {
		x1 = 0;
		x2 = -1 / B;
	} else {
		x1 = Math.sqrt(sqrtArg);
		x2 = 1 / (-B - x1 / (R_squared + x1 * x1));
	}

	let matching_reactive_comp_1 = getRLCValsForImpedance({real: 0, imag: x1}, frequency);
	let matching_reactive_comp_2 = getRLCValsForImpedance({real: 0, imag: x2}, frequency);

	matching_components.push({
		reactance_1: x1,
		matching_reactive_comp_1,
		reactance_2: x2,
		matching_reactive_comp_2,
		note: 'x1 in series with generator / load impedance and x2 in parallel after (generator case) or before (load case)',
		...(sqrtArg < 0 ? {note_2: 'approximate solution as not real solution available', error: true} : {})		
	});

	if (sqrtArg > 0) {
		x1 = -x1;
		x2 = 1 / (-B - x1 / (R_squared + x1 * x1));

		matching_reactive_comp_1 = getRLCValsForImpedance({real: 0, imag: x1}, frequency);
		matching_reactive_comp_2 = getRLCValsForImpedance({real: 0, imag: x2}, frequency);

		matching_components.push({
			reactance_1: x1,
			matching_reactive_comp_1,
			reactance_2: x2,
			matching_reactive_comp_2,
			note: 'x1 in series with generator / load impedance and x2 in parallel after (generator case) or before (load case)'
		});
	}

	return matching_components;
}

globalThis.find_series_parallel_LC_components_to_obtain_target_impedance_V2 = (target_impedance, fixed_impedance, frequency) => {
	// L network with first (right after the fixed Zsource) the series component and then the parallel one

	/* 
		series impedance: Rs + j * Xs
	 	parallel impedance: j * Xp
		both are in parallel looking from the port towards the generator
		Admittance of parallel branches is a sum: Y = 1 / (Rs + j * Xs) + 1 / (j * Xp)
		It can be shown that (can be verified numerically for one thing):
		1 / (Rs + j * Xs) = (Rs - j * Xs) / (Rs^2 + Xs^2)
		and
		1 / (j * Xp) = -j / Xp (because 1 / j = -j)
		Thus Yt:
		Yt = Rs / (Rs^2 + Xs^2) - j * (Xs / (Rs^2 + Xs^2) + 1 / Xp)
		
		// The only unknowns are Xs and Xp
		G = Rs / (Rs^2 + Xs^2)
		
		// Solving for Xs:
		G * (Rs^2 + Xs^2) = Rs
		G * Xs^2 = Rs - G * Rs^2
		
		Xs^2 = (Rs - G * Rs^2) / G,
		Xs = +/- sqrt((Rs - G * Rs^2) / G)
		Xs = fixed_impedance.imag + seriesImpedance.imag
		seriesImpedance.imag = Xs - fixed_impedance.imag

		Now G is the real part of the target admittance ((1 / target_impedance).real),
		And once more it can be shown that 1 / (Rtarget + j * Xtarget) = (Rtarget - j * Xtarget) / (Rtarget^2 + Xtarget^2),
		Leaving the real part as: Rtarget / (Rtarget^2 + Xtarget^2)

		// Solving for Xp:
		-(Xs / (Rs^2 + Xs^2) + 1 / Xp) = B (the imag part of the target admittance) = -Xtarget / (Rtarget^2 + Xtarget^2)
		-1/Xp = -Xtarget / (Rtarget^2 + Xtarget^2) + Xs / (Rs^2 + Xs^2)
		Xp = -1 * (1 / (-Xtarget / (Rtarget^2 + Xtarget^2) + Xs / (Rs^2 + Xs^2)))
	*/

	const R_squared = fixed_impedance.real * fixed_impedance.real;
	const denominator = (target_impedance.real * target_impedance.real + target_impedance.imag * target_impedance.imag);
	const G = target_impedance.real / denominator;
	const B = -target_impedance.imag / denominator;

	const matching_components = [];

	let x1 = 0;
	let x2 = 0;

	let sqrtArg = (fixed_impedance.real - G * R_squared) / G;
	// console.log('sqrtArg', sqrtArg);

	if (sqrtArg < 0) {
		x1 = 0;
		x2 = -1 / B;
	} else {
		x1 = Math.sqrt(sqrtArg);
		x2 = 1 / (-B - x1 / (R_squared + x1 * x1));
	}

	let matching_reactive_comp_1 = getRLCValsForImpedance({real: 0, imag: (x1 - fixed_impedance.imag)}, frequency);
	let matching_reactive_comp_2 = getRLCValsForImpedance({real: 0, imag: x2}, frequency);

	matching_components.push({
		reactance_1: x1 - fixed_impedance.imag,
		matching_reactive_comp_1,
		reactance_2: x2,
		matching_reactive_comp_2,
		note: 'x1 in series with generator / load impedance and x2 in parallel after (generator case) or before (load case)',
		...(sqrtArg < 0 ? {note_2: 'approximate solution as not real solution available', error: true} : {})
	});

	if (sqrtArg > 0) {
		x1 = -x1;
		x2 = 1 / (-B - x1 / (R_squared + x1 * x1));

		matching_reactive_comp_1 = getRLCValsForImpedance({real: 0, imag: (x1 - fixed_impedance.imag)}, frequency);
		matching_reactive_comp_2 = getRLCValsForImpedance({real: 0, imag: x2}, frequency);

		matching_components.push({
			reactance_1: x1 - fixed_impedance.imag,
			matching_reactive_comp_1,
			reactance_2: x2,
			matching_reactive_comp_2,
			note: 'x1 in series with generator / load impedance and x2 in parallel after (generator case) or before (load case)'
		});
	}

	return matching_components;
}

globalThis.find_parallel_series_LC_components_to_obtain_target_impedance = (target_impedance, fixed_impedance, frequency) => {
	// L network with first (right after the fixed Zsource) the parallel component and then the series one
	// This is also a T network if we add a chosen impedance in series with the fixed impedance

	/* 
		fixed series impedance: Rfixed + j * Xfixed
	 	parallel impedance: j * Xp
		series impedance: j * Xs

		Yfixed_and_parallel = 1 / (Rfixed + j * Xfixed) + 1 / (j * Xp)
		Yfixed_and_parallel = Rfixed / (Rfixed^2 + Xfixed^2) - j * (Xfixed / (Rfixed^2 + Xfixed^2) + 1 / Xp)
		
		Rfixed / (Rfixed^2 + Xfixed^2) = Gtarget = Rtarget / (Rtarget^2 + Xtarget^2)

		But then I'm not allowed to have any variable to control G at this point

		We conclude:
		In general: Gfixed_parallel != Gtarget
		and Xp cannot change Gfixed_parallel, because its admittance is purely imaginary.

		That's OK: because Yfixed_and_parallel || -j/Xs would let us control real part of G.
		Should we then (Yfixed_and_parallel * (-j/Xs)) / (Yfixed_and_parallel -j/Xs)
		
		This seems like a lot of work, so let's try a different path

		Instead we can continue by converting Yfixed_and_parallel to impedance:
		Zfixed_and_parallel = 1 / Yfixed_and_parallel

		It can be shown (and can be verified numerically):
		Z = G / (G^2 + B^2) - j * B / (G^2 + B^2)

		Zfixed_and_parallel.real = (Rfixed / (Rfixed^2 + Xfixed^2)) / ((Rfixed / (Rfixed^2 + Xfixed^2))^2 + (Xfixed / (Rfixed^2 + Xfixed^2) + 1 / Xp)^2)

		G = Rfixed / (Rfixed^2 + Xfixed^2)
		Define partB as: Xfixed / (Rfixed^2 + Xfixed^2)

		G / (G^2 + partB^2 + 2 * partB / Xp + 1 / Xp^2) = target_impedance.real
		G = (G^2 + partB^2 + 2 * partB / Xp + 1 / Xp^2) * target_impedance.real
		G - target_impedance.real * G^2 - partB^2 * target_impedance.real = 2 * partB * target_impedance.real / Xp + target_impedance.real / Xp^2
		(G - target_impedance.real * G^2 - partB^2 * target_impedance.real) * Xp^2 - 2 * partB * target_impedance.real * Xp - target_impedance.real = 0

		This is a quadric equation of the form:
		a * Xp^2 + b * Xp + c = 0
		with a, b, c known real numbers

		Xp = (-b +/- sqrt(b^2 - 4ac))/2a
		
		Then with Xp known is the reactance: -B / (G^2 + B^2)
		-B / (G^2 + B^2) + Xs = target_impedance.imag
	*/

	const R_squared = fixed_impedance.real * fixed_impedance.real;
	const X_squared = fixed_impedance.imag * fixed_impedance.imag;

	const G = fixed_impedance.real / (R_squared + X_squared);
	const part_of_B = fixed_impedance.imag / (R_squared + X_squared);

	const a = G - target_impedance.real * G * G - part_of_B * part_of_B * target_impedance.real;
	const b = -2 * part_of_B * target_impedance.real;
	const c = -target_impedance.real;

	if ((b * b - 4 * a * c) < 0) {
		return [{
			note: 'no solution with negative discriminant',
			error: true
		}];
	}

	const Xp_1 = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
	const B_1 = -(fixed_impedance.imag / (R_squared + X_squared) + 1 / Xp_1);
	const Xs_1 = target_impedance.imag + B_1 / (G * G + B_1 * B_1);

	const Xp_2 = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);
	const B_2 = -(fixed_impedance.imag / (R_squared + X_squared) + 1 / Xp_2);
	const Xs_2 = target_impedance.imag + B_2 / (G * G + B_2 * B_2);	

	const matching_components = [];

	let matching_reactive_comp_1 = getRLCValsForImpedance({real: 0, imag: Xp_1}, frequency);
	let matching_reactive_comp_2 = getRLCValsForImpedance({real: 0, imag: Xs_1}, frequency);

	matching_components.push({
		reactance_1: Xp_1,
		matching_reactive_comp_1,
		reactance_2: Xs_1,
		matching_reactive_comp_2,
		note: 'x1 in parallel with generator / load impedance and x2 in series after (generator case) or before (load case)'
	});

	matching_reactive_comp_1 = getRLCValsForImpedance({real: 0, imag: Xp_2}, frequency);
	matching_reactive_comp_2 = getRLCValsForImpedance({real: 0, imag: Xs_2}, frequency);

	matching_components.push({
		reactance_1: Xp_2,
		matching_reactive_comp_1,
		reactance_2: Xs_2,
		matching_reactive_comp_2,
		note: 'x1 in parallel with generator / load impedance and x2 in series after (generator case) or before (load case)'
	});

	return matching_components;
}

globalThis.getInductorReactanceByFrequency = (inductance, frequency) => {
	return (2 * Math.PI * frequency * inductance);
}

globalThis.getCapacitorReactanceByFrequency = (capacitor, frequency) => {
	return 1 / (2 * Math.PI * frequency * capacitor);
}

globalThis.get_impedance_for_RLC_value = (RLC, frequency) => {
	let reactance = 0;
	if (RLC.inductor) {
		reactance += getInductorReactanceByFrequency(RLC.inductor, frequency);
	}
	if (RLC.capacitor) {
		reactance -= getCapacitorReactanceByFrequency(RLC.capacitor, frequency);		
	}

	return {
		real: RLC.resistor ? RLC.resistor : 0,
		imag: reactance
	}
}

globalThis.find_bilateral_match_numerically = (generator, load, S11, S21, S12, S22, use_port_LC_components, frequency, z0_magnitude, beta) => {
	const generator_with_evolving_impedance = Object.assign({}, generator);
	const load_with_evolving_impedance = Object.assign({}, load);

	let matching_impedance_generator_side; 
	let matching_impedance_load_side;

	for (let i = 0; i < 1000; i++) {
		const signalFlowVals = findSignalFlowNodeValues(
			generator_with_evolving_impedance,
			load_with_evolving_impedance,
			S11,
			S21,
			S12,
			S22,
			z0_magnitude,
			beta
		);

		matching_impedance_generator_side = match_gammaIn_at_generator(signalFlowVals, generator, frequency, z0_magnitude, beta);
		matching_impedance_load_side = match_gammaOut_at_load(signalFlowVals, generator, frequency, z0_magnitude, beta);

		const new_generator_z = matching_impedance_generator_side.conjugate_impedance_at_generator;
		const new_load_z = matching_impedance_load_side.conjugate_impedance_at_load;

		generator_with_evolving_impedance.generator_impedance_real += 0.01 * (new_generator_z.real - generator_with_evolving_impedance.generator_impedance_real);
		generator_with_evolving_impedance.generator_impedance_imag += 0.01 * (new_generator_z.imag - generator_with_evolving_impedance.generator_impedance_imag);

		load_with_evolving_impedance.real += 0.01 * (new_load_z.real - load_with_evolving_impedance.real);
		load_with_evolving_impedance.imag += 0.01 * (new_load_z.imag - load_with_evolving_impedance.imag);
	}

	const matching_LC_components_generator_side = find_LC_components_to_obtain_target_impedance(
		use_port_LC_components ? matching_impedance_generator_side.conjugate_impedance_at_tl1_length : matching_impedance_generator_side.conjugate_impedance_at_generator, 
		generator.generator_impedance_real, 
		frequency
	);
	const matching_LC_components_generator_side_v2 = find_series_parallel_LC_components_to_obtain_target_impedance_V2(
		use_port_LC_components ? matching_impedance_generator_side.conjugate_impedance_at_tl1_length : matching_impedance_generator_side.conjugate_impedance_at_generator, 
		{real: generator.generator_impedance_real, imag: generator.generator_impedance_imag},
		frequency
	);
	const matching_T_config_LC_components_generator_side = find_parallel_series_LC_components_to_obtain_target_impedance(
		use_port_LC_components ? matching_impedance_generator_side.conjugate_impedance_at_tl1_length : matching_impedance_generator_side.conjugate_impedance_at_generator,
		{real: generator.generator_impedance_real, imag: generator.generator_impedance_imag},
		frequency
	);
	// console.log('matching_impedance_generator_side', matching_impedance_generator_side);
	// console.log('matching_LC_components_generator_side', matching_LC_components_generator_side);
	// console.log('matching_LC_components_generator_side_v2', matching_LC_components_generator_side_v2);
	// console.log('matching_T_config_LC_components_generator_side', matching_T_config_LC_components_generator_side);

	const matching_LC_components_load_side = find_LC_components_to_obtain_target_impedance(
		use_port_LC_components ? matching_impedance_load_side.conjugate_impedance_at_tl2_length : matching_impedance_load_side.conjugate_impedance_at_load, 
		load.real, 
		frequency
	);
	const matching_LC_components_load_side_v2 = find_series_parallel_LC_components_to_obtain_target_impedance_V2(
		use_port_LC_components ? matching_impedance_load_side.conjugate_impedance_at_tl2_length : matching_impedance_load_side.conjugate_impedance_at_load, 
		{real: load.real, imag: load.imag},
		frequency
	);
	const matching_T_config_LC_components_load_side = find_parallel_series_LC_components_to_obtain_target_impedance(
		use_port_LC_components ? matching_impedance_load_side.conjugate_impedance_at_tl2_length : matching_impedance_load_side.conjugate_impedance_at_load,
		{real: load.real, imag: load.imag},
		frequency
	);
	// console.log('matching_impedance_load_side', matching_impedance_load_side);
	// console.log('matching_LC_components_load_side', matching_LC_components_load_side);
	// console.log('matching_LC_components_load_side_v2', matching_LC_components_load_side_v2);
	// console.log('matching_T_config_LC_components_load_side', matching_T_config_LC_components_load_side);

	// BUG AT PORT: if resistor isn't matched with TL need to provide the resistor as seen at port
	// And this whole thing with finding the components should move to a different function anyway instead of residing together
	// with the matched impedance finder
	return {
		matching_impedance_generator_side,
		matching_impedance_load_side,
		
		matching_LC_components_generator_side,
		matching_LC_components_generator_side_v2,
		matching_T_config_LC_components_generator_side,
		
		matching_LC_components_load_side,
		matching_LC_components_load_side_v2,
		matching_T_config_LC_components_load_side,

		allMatchingConfigs: {
			port: {
				generator: {
					L_config_LC_comps: find_series_parallel_LC_components_to_obtain_target_impedance_V2(
						matching_impedance_generator_side.conjugate_impedance_at_tl1_length,
						{real: generator.generator_impedance_real, imag: generator.generator_impedance_imag},
						frequency
					),
					T_config_LC_comps: find_parallel_series_LC_components_to_obtain_target_impedance(
						matching_impedance_generator_side.conjugate_impedance_at_tl1_length,
						{real: generator.generator_impedance_real, imag: generator.generator_impedance_imag},
						frequency
					)
				},
				load: {
					L_config_LC_comps: find_series_parallel_LC_components_to_obtain_target_impedance_V2(
						matching_impedance_load_side.conjugate_impedance_at_tl2_length,
						{real: load.real, imag: load.imag},
						frequency
					),
					T_config_LC_comps: find_parallel_series_LC_components_to_obtain_target_impedance(
						matching_impedance_load_side.conjugate_impedance_at_tl2_length,
						{real: load.real, imag: load.imag},
						frequency
					)					
				}
			},
			generator_load: {
				generator: {
					L_config_LC_comps: find_series_parallel_LC_components_to_obtain_target_impedance_V2(
						matching_impedance_generator_side.conjugate_impedance_at_generator,
						{real: generator.generator_impedance_real, imag: generator.generator_impedance_imag},
						frequency
					),
					T_config_LC_comps: find_parallel_series_LC_components_to_obtain_target_impedance(
						matching_impedance_generator_side.conjugate_impedance_at_generator,
						{real: generator.generator_impedance_real, imag: generator.generator_impedance_imag},
						frequency
					)
				},
				load: {
					L_config_LC_comps: find_series_parallel_LC_components_to_obtain_target_impedance_V2(
						matching_impedance_load_side.conjugate_impedance_at_load,
						{real: load.real, imag: load.imag},
						frequency
					),
					T_config_LC_comps: find_parallel_series_LC_components_to_obtain_target_impedance(
						matching_impedance_load_side.conjugate_impedance_at_load,
						{real: load.real, imag: load.imag},
						frequency
					)					
				}
			}			
		}
	}
}

globalThis.find_thevenin_equivalent_circuit_with_T_matching_network = function(
	LRC_1_series, 
	LC_shunt, 
	LRC_2_series, 
	is_z_at_port, // boolean
	tl_length_from_port_to_z, // float
	generator,
	load,
	frequency,
	z0_magnitude, 
	baseline_beta,
	baseline_beta_frequency
) {
	const beta = baseline_beta * (frequency / baseline_beta_frequency);

	generator = generator ? Object.assign({}, generator) : null;
	if (generator) {
		if (generator.generator_impedance_imag >= 0) {
			generator.generator_impedance_imag *= (frequency / baseline_beta_frequency);
		} else {
			generator.generator_impedance_imag *= (1 / (frequency / baseline_beta_frequency));
		}
	}

	load = load ? Object.assign({}, load) : null;
	if (load) {
		if (load.imag >= 0) {
			load.imag *= (frequency / baseline_beta_frequency);
		} else {
			load.imag *= (1 / (frequency / baseline_beta_frequency));
		}
	}

	const z1_series = get_impedance_for_RLC_value(LRC_1_series, frequency);
	let z1_series_z_th_final = Object.assign({}, z1_series);
	if (generator) {	
		if (!is_z_at_port) {
			z1_series.real += generator.generator_impedance_real;
			z1_series.imag += generator.generator_impedance_imag;
			z1_series_z_th_final = z1_series;		
		} else {
			const z_source_reflection_at_generator = divideComplexNums(
				generator.generator_impedance_real - z0_magnitude,
				generator.generator_impedance_imag,
				generator.generator_impedance_real + z0_magnitude,
				generator.generator_impedance_imag,
			);

			const z_source_reflection_at_port = multiplyComplexNums_v2(
				z_source_reflection_at_generator,
				{
					real: Math.cos(-2 * beta * tl_length_from_port_to_z),
					imag: Math.sin(-2 * beta * tl_length_from_port_to_z)
				}
			);

			const z_source_at_port = divideComplexNums(
				z_source_reflection_at_port.real * z0_magnitude + z0_magnitude,
				z_source_reflection_at_port.imag * z0_magnitude,
				1 - z_source_reflection_at_port.real,
				-z_source_reflection_at_port.imag
			);

			z1_series_z_th_final.real += z_source_at_port.real;
			z1_series_z_th_final.imag += z_source_at_port.imag;		
		}
	} else if (load) {
		if (!is_z_at_port) {
			z1_series_z_th_final.real += load.real;
			z1_series_z_th_final.imag += load.imag;
		} else {
			let reflection_at_load = divideComplexNums(
				load.real - z0_magnitude,
				load.imag,
				load.real + z0_magnitude,
				load.imag
			);

			reflection_at_load = multiplyComplexNums_v2(
				reflection_at_load,
				{
					real: Math.cos(-2 * beta * tl_length_from_port_to_z),
					imag: Math.sin(-2 * beta * tl_length_from_port_to_z)
				}
			)

			const z_load_at_port = divideComplexNums(
				reflection_at_load.real * z0_magnitude + z0_magnitude,
				reflection_at_load.imag * z0_magnitude,
				1 - reflection_at_load.real,
				-reflection_at_load.imag
			);

			z1_series_z_th_final.real += z_load_at_port.real;
			z1_series_z_th_final.imag += z_load_at_port.imag;
		}
	}

	const z_shunt = LC_shunt ? get_impedance_for_RLC_value(LC_shunt, frequency) : {real: 1e8, imag: 0};
	let z2_series = get_impedance_for_RLC_value(LRC_2_series, frequency);

	const numerator = multiplyComplexNums_v2(z_shunt, z1_series_z_th_final);
	const denominator = addComplexNums(z_shunt, z1_series_z_th_final);
	const z_parallel_equivalent = divideComplexNums_v2(numerator, denominator);
	const z_equivalent = addComplexNums(z_parallel_equivalent, z2_series);

	const reflection = divideComplexNums(
		z_equivalent.real - z0_magnitude,
		z_equivalent.imag,
		z_equivalent.real + z0_magnitude,
		z_equivalent.imag,
	);
	const z_thevenin_looking_from_port = getImpedanceAtDistanceFromLoad_lossless_TL(is_z_at_port ? 0 : tl_length_from_port_to_z, reflection, z0_magnitude, beta);
	// console.log('z_thevenin_looking_from_port', z_thevenin_looking_from_port);

	if (!generator) {
		return { z_thevenin_looking_from_port }
	}

	let generator_open_circuit_thevenin_voltage;

	if (tl_length_from_port_to_z === 0) {
		// open circuit z consists of one series and one parallel impedance (the other series impedance is an open circuited stub)
		let open_circuit_z_seen_by_generator = addComplexNums(z1_series_z_th_final, z_shunt)

		const open_circuited_current = divideComplexNums(
			generator.generator_voltage_real,
			generator.generator_voltage_imag,
			open_circuit_z_seen_by_generator.real,
			open_circuit_z_seen_by_generator.imag
		);

		generator_open_circuit_thevenin_voltage = multiplyComplexNums_v2(z_shunt, open_circuited_current);
	} else if (!is_z_at_port) {
		const openCircuitedReflection = {
			magnitude: 1,
			theta: 0,
			real: 1,
			imag: 0
		};
		const z_tl = getImpedanceAtDistanceFromLoad_lossless_TL(tl_length_from_port_to_z, openCircuitedReflection, z0_magnitude, beta);
		let z_post_shunt_in_series_with_tl = addComplexNums(z2_series, z_tl);

		const numerator = multiplyComplexNums_v2(z_shunt, z_post_shunt_in_series_with_tl);
		const denominator = addComplexNums(z_shunt, z_post_shunt_in_series_with_tl);
		const z_parallel_equivalent = divideComplexNums_v2(numerator, denominator);
		
		let open_circuit_z_seen_by_generator = addComplexNums(z1_series, z_parallel_equivalent);

		const open_circuited_current = divideComplexNums(
			generator.generator_voltage_real,
			generator.generator_voltage_imag,
			open_circuit_z_seen_by_generator.real,
			open_circuit_z_seen_by_generator.imag
		);

		let voltage_across_z_series = multiplyComplexNums_v2(open_circuited_current, z1_series); 

		const shunt_voltage = subtractComplexNums(
			{
				real: generator.generator_voltage_real,
				imag: generator.generator_voltage_imag
			},
			voltage_across_z_series
		);
		const shunt_current = divideComplexNums_v2(shunt_voltage, z_shunt);
		const next_z_series_current = subtractComplexNums(open_circuited_current, shunt_current);
		let voltage_across_next_z_series = multiplyComplexNums_v2(next_z_series_current, z2_series);
		
		const voltage_at_tl_entry_generator_side = subtractComplexNums(shunt_voltage, voltage_across_next_z_series);
		// console.log('voltage_at_tl_entry_generator_side', voltage_at_tl_entry_generator_side);

		const reflection_at_tl_entry = divideComplexNums(
			z_tl.real - z0_magnitude,
			z_tl.imag,
			z_tl.real + z0_magnitude,
			z_tl.imag
		);

		// a + reflection_at_tl_entry * a = v / sqrt(z0)
		// (1 + reflection_at_tl_entry) * a = v / sqrt(z0)
		// a = v / sqrt(z0) / (1 + reflection_at_tl_entry)
		// b = reflection_at_tl_entry * a

		const a_not_normalized_at_tl_entry = divideComplexNums_v2(
			voltage_at_tl_entry_generator_side,
			{
				real: reflection_at_tl_entry.real + 1,
				imag: reflection_at_tl_entry.imag
			}
		);
		// const b_not_normalized_at_tl_entry = multiplyComplexNums_v2(reflection_at_tl_entry, a_not_normalized);
		
		const a_not_normalized_at_port = multiplyComplexNums_v2(
			a_not_normalized_at_tl_entry, 
			{
				real: Math.cos(-beta * tl_length_from_port_to_z),
				imag: Math.sin(-beta * tl_length_from_port_to_z)
			}
		);

		generator_open_circuit_thevenin_voltage = {
			real: 2 * a_not_normalized_at_port.real,
			imag: 2 * a_not_normalized_at_port.imag,
			...convert_complex_num_from_cartesian_to_polar(
				2 * a_not_normalized_at_port.real, 
				2 * a_not_normalized_at_port.imag
			)
		};
		// console.log('generator_open_circuit_thevenin_voltage', generator_open_circuit_thevenin_voltage);

		// but this may not be stable when reflection_at_tl_entry is -1 and we're then dividing by zero to find a_not_normalized_at_tl_entry
		// instead:
		// Z0 * I = Z0 * I+ + Z0 * I- = V+ - V-
		// and then: V = V+ + V-
		// adding together: V + Z0 * I = 2V+

		const v_plus_times_two_at_tl_entry = addComplexNums(
			voltage_at_tl_entry_generator_side,
			{
				real: z0_magnitude * next_z_series_current.real,
				imag: z0_magnitude * next_z_series_current.imag
			}
		);
		// console.log(v_plus_times_two_at_tl_entry);

		generator_open_circuit_thevenin_voltage = multiplyComplexNums_v2(
			v_plus_times_two_at_tl_entry, 
			{
				real: Math.cos(-beta * tl_length_from_port_to_z),
				imag: Math.sin(-beta * tl_length_from_port_to_z)
			}
		);
		const generator_open_circuit_thevenin_voltage_polar = convert_complex_num_from_cartesian_to_polar(
			generator_open_circuit_thevenin_voltage.real, 
			generator_open_circuit_thevenin_voltage.imag
		)
		generator_open_circuit_thevenin_voltage.magnitude = generator_open_circuit_thevenin_voltage_polar.magnitude;
		generator_open_circuit_thevenin_voltage.theta = generator_open_circuit_thevenin_voltage_polar.theta;
		// console.log('generator_open_circuit_thevenin_voltage (stable)', generator_open_circuit_thevenin_voltage);
	} else if (is_z_at_port) {
		// shunt element after the TL
		const reflection_port = divideComplexNums(
			z1_series.real + z_shunt.real - z0_magnitude,
			z1_series.imag + z_shunt.imag,
			z1_series.real + z_shunt.real + z0_magnitude,
			z1_series.imag + z_shunt.imag,
		);

		const reflection_at_generator = multiplyComplexNums_v2(
			reflection_port,
			{
				real: Math.cos(-2 * beta * tl_length_from_port_to_z),
				imag: Math.sin(-2 * beta * tl_length_from_port_to_z)
			}
		);

		/*reflection_generator = (z_gen - z0) / (z_gen + z0)
		(z_gen + z0) * reflection_generator = (z_gen - z0)
		(1 - reflection_generator) * z_gen = reflection_generator * z0 + z0
		z_gen = (reflection_generator * z0 + z0) / (1 - reflection_generator)
		current_gen = v_gen / (z_source + z_gen)
		//  V + Z0 * I = 2V+
		v_gen + Z0 * current_gen = 2V+
		V+ = (v_gen + Z0 * current_gen) / 2*/

		const z_in_tl_at_generator = divideComplexNums(
			reflection_at_generator.real * z0_magnitude + z0_magnitude,
			reflection_at_generator.imag * z0_magnitude,
			1 - reflection_at_generator.real,
			-reflection_at_generator.imag
		);

		const current_in_tl_at_generator = divideComplexNums(
			generator.generator_voltage_real,
			generator.generator_voltage_imag,
			generator.generator_impedance_real + z_in_tl_at_generator.real,
			generator.generator_impedance_imag + z_in_tl_at_generator.imag
		);

		const v0_plus = addComplexNums(
			multiplyComplexNums_v2(z_in_tl_at_generator, current_in_tl_at_generator),
			{
				real: current_in_tl_at_generator.real * z0_magnitude,
				imag: current_in_tl_at_generator.imag * z0_magnitude
			}
		);
		v0_plus.real /= 2;
		v0_plus.imag /= 2;

		let voltage_port = multiplyComplexNums_v2(
			v0_plus,
			{
				real: Math.cos(-beta * tl_length_from_port_to_z),
				imag: Math.sin(-beta * tl_length_from_port_to_z)
			}
		)

		voltage_port = addComplexNums(
			voltage_port,
			multiplyComplexNums_v2(
				voltage_port,
				reflection_port
			)
		);

		const current_port = divideComplexNums_v2(
			voltage_port,
			{
				real: z1_series.real + z_shunt.real,
				imag: z1_series.imag + z_shunt.imag				
			}
		)

		generator_open_circuit_thevenin_voltage = multiplyComplexNums_v2(
			current_port,
			z_shunt
		);
		const generator_open_circuit_thevenin_voltage_polar = convert_complex_num_from_cartesian_to_polar(generator_open_circuit_thevenin_voltage.real, generator_open_circuit_thevenin_voltage.imag);
		generator_open_circuit_thevenin_voltage.magnitude = generator_open_circuit_thevenin_voltage_polar.magnitude;
		generator_open_circuit_thevenin_voltage.theta = generator_open_circuit_thevenin_voltage_polar.theta;
	}
	
	return {
		generator_open_circuit_thevenin_voltage,
		z_thevenin_looking_from_port 
	}
}

globalThis.get_thevenin_equivalents_of_matching_configs = (bilateral_matching, bileteral_match_at_port, generator, load, frequency, baseline_beta_frequency, z0_magnitude, beta) => {
	/*
		matching_impedance_generator_side,
		matching_impedance_load_side,
		matching_LC_components_generator_side,
		matching_LC_components_generator_side_v2,
		matching_T_config_LC_components_generator_side,
		matching_LC_components_load_side,
		matching_LC_components_load_side_v2,
		matching_T_config_LC_components_load_side
	*/
	const matching_impedance_generator_side = bilateral_matching.matching_impedance_generator_side;
	const matching_impedance_load_side = bilateral_matching.matching_impedance_load_side;

	const gen_side_matches_thevenin_equivalents = [];
	const load_side_matches_thevenin_equivalents = [];

	for (let i = 0; i < bilateral_matching.matching_LC_components_generator_side_v2.length; i++) {
		const gen_side_match = bilateral_matching.matching_LC_components_generator_side_v2[i];
		if (!gen_side_match.error) {
			const theveninEquivalentGenSide = globalThis.find_thevenin_equivalent_circuit_with_T_matching_network(
				getRLCValsForImpedance({
					real: 0, 
					imag: gen_side_match.reactance_1
				}, frequency),				
				gen_side_match.matching_reactive_comp_2, // shunt
				getRLCValsForImpedance({real: 0, imag: 0}, frequency),
				bileteral_match_at_port,
				generator.generator_tl1_length,
				generator,
				null, // load
				frequency,
				z0_magnitude, 
				beta,
				baseline_beta_frequency // baseline_beta_frequency
			);

			const matchingTarget = matching_impedance_generator_side.conjugate_impedance_at_tl1_length
			const z_thevenin_looking_from_port = theveninEquivalentGenSide.z_thevenin_looking_from_port
			if (frequency === baseline_beta_frequency) {
				if (Math.abs(z_thevenin_looking_from_port.real - matchingTarget.real) < 1e-5 && Math.abs(z_thevenin_looking_from_port.imag - matchingTarget.imag) < 1e-5) {
					console.log('gen side (L): match confirmed!');
					gen_side_matches_thevenin_equivalents.push({
						theveninEquivalentGenSide,
						components: bilateral_matching.matching_LC_components_generator_side_v2[i],
						bileteral_match_at_port,
						match_type: 'L-match',
						note: 'L config with series next to gen then shunt (if not matched at port, requires phase shifting components)'
					});
				} else {
					console.log('gen side (L): match failed!!!')
				}
			} else {
				console.log('gen side (L): new frequency so can\'t confirm match');
				gen_side_matches_thevenin_equivalents.push(theveninEquivalentGenSide);				
			}
		} else {
			console.log('gen side: error in L-network');
		}
	}

	for (let i = 0; i < bilateral_matching.matching_T_config_LC_components_generator_side.length; i++) {
		const gen_side_match = bilateral_matching.matching_T_config_LC_components_generator_side[i];
		if (!gen_side_match.error) {
			const theveninEquivalentGenSide = globalThis.find_thevenin_equivalent_circuit_with_T_matching_network(
				getRLCValsForImpedance({
					real: 0, 
					imag: 0
				}, frequency),
				gen_side_match.matching_reactive_comp_1, // shunt
				gen_side_match.matching_reactive_comp_2,
				bileteral_match_at_port,
				generator.generator_tl1_length,
				generator, 
				null, // load
				frequency,
				z0_magnitude, 
				beta,
				baseline_beta_frequency // baseline_beta_frequency
			);

			const matchingTarget = matching_impedance_generator_side.conjugate_impedance_at_tl1_length
			const z_thevenin_looking_from_port = theveninEquivalentGenSide.z_thevenin_looking_from_port
			if (frequency === baseline_beta_frequency) {
				if (Math.abs(z_thevenin_looking_from_port.real - matchingTarget.real) < 1e-5 && Math.abs(z_thevenin_looking_from_port.imag - matchingTarget.imag) < 1e-5) {
					console.log('gen side (T): match confirmed!');
					gen_side_matches_thevenin_equivalents.push({
						theveninEquivalentGenSide,
						components: bilateral_matching.matching_T_config_LC_components_generator_side[i],
						bileteral_match_at_port,
						match_type: 'T-match',
						note: 'T config with shunt next to gen then series (if not matched at port, requires phase shifting components)'
					});
				} else {
					console.log('gen side (T): match failed!!!')
				}
			} else {
				console.log('gen side (T): new frequency so can\'t confirm match');
				gen_side_matches_thevenin_equivalents.push(theveninEquivalentGenSide);				
			}
		} else {
			console.log('gen side: error in T-network');
		}
	}

	for (let i = 0; i < bilateral_matching.matching_LC_components_load_side_v2.length; i++) {
		const load_side_match = bilateral_matching.matching_LC_components_load_side_v2[i];
		if (!load_side_match.error) {
			const theveninEquivalentLoadSide = globalThis.find_thevenin_equivalent_circuit_with_T_matching_network(
				getRLCValsForImpedance({
					real: 0, 
					imag: load_side_match.reactance_1
				}, frequency),				
				load_side_match.matching_reactive_comp_2, // shunt
				getRLCValsForImpedance({real: 0, imag: 0}, frequency),
				bileteral_match_at_port,
				generator.generator_tl2_length,
				null, // generator
				load,
				frequency,
				z0_magnitude, 
				beta,
				baseline_beta_frequency // baseline_beta_frequency
			);

			const matchingTarget = matching_impedance_load_side.conjugate_impedance_at_tl2_length
			const z_thevenin_looking_from_port = theveninEquivalentLoadSide.z_thevenin_looking_from_port
			if (frequency === baseline_beta_frequency) {
				if (Math.abs(z_thevenin_looking_from_port.real - matchingTarget.real) < 1e-5 && Math.abs(z_thevenin_looking_from_port.imag - matchingTarget.imag) < 1e-5) {
					console.log('load side (L): match confirmed!');
					load_side_matches_thevenin_equivalents.push({
						theveninEquivalentLoadSide,
						components: bilateral_matching.matching_LC_components_load_side_v2[i],
						bileteral_match_at_port,
						match_type: 'L-match',
						note: 'L config with series next to load then shunt (if not matched at port, requires phase shifting components)'
					});
				} else {
					console.log('load side (L): match failed!!!')
				}
			} else {
				console.log('load side (L): new frequency so can\'t confirm match');
				load_side_matches_thevenin_equivalents.push(theveninEquivalentGenSide);				
			}
		} else {
			console.log('load side: error in L-network');
		}
	}	

	for (let i = 0; i < bilateral_matching.matching_T_config_LC_components_load_side.length; i++) {
		const load_side_match = bilateral_matching.matching_T_config_LC_components_load_side[i];
		if (!load_side_match.error) {
			const theveninEquivalentLoadSide = globalThis.find_thevenin_equivalent_circuit_with_T_matching_network(
				getRLCValsForImpedance({real: 0, imag: 0}, frequency),
				load_side_match.matching_reactive_comp_1, // shunt	
				load_side_match.matching_reactive_comp_2,
				bileteral_match_at_port,
				generator.generator_tl2_length, // tl_length_from_port_to_z, 
				null, // generator
				load,
				frequency,
				z0_magnitude, 
				beta,
				baseline_beta_frequency // baseline_beta_frequency
			);

			const matchingTarget = matching_impedance_load_side.conjugate_impedance_at_tl2_length
			const z_thevenin_looking_from_port = theveninEquivalentLoadSide.z_thevenin_looking_from_port
			if (frequency === baseline_beta_frequency) {
				if (Math.abs(z_thevenin_looking_from_port.real - matchingTarget.real) < 1e-5 && Math.abs(z_thevenin_looking_from_port.imag - matchingTarget.imag) < 1e-5) {
					console.log('load side (T): match confirmed!');
					load_side_matches_thevenin_equivalents.push({
						theveninEquivalentLoadSide,
						components: bilateral_matching.matching_T_config_LC_components_load_side[i],
						bileteral_match_at_port,
						match_type: 'T-match',
						note: 'T match with shunt next to gen then series (if not matched at port, requires phase shifting components)',
					});					
				} else {
					console.log('load side (T): match failed!!!')
				}
			} else {
				console.log('load side (T): new frequency so can\'t confirm match');
				load_side_matches_thevenin_equivalents.push(theveninEquivalentLoadSide);				
			}			
		} else {
			console.log('load side: error in T-network');
		}
	}

	return {
		gen_side_matches_thevenin_equivalents,
		load_side_matches_thevenin_equivalents
	}
}

globalThis.get_load_voltage_for_impedance_matched_configs = (thevenin_equivalents_of_matched_configs, bilateral_matching, S11, S21, S12, S22, frequency, baseline_frequency, z0_magnitude, baseline_beta) => {
	const beta = baseline_beta * (frequency / baseline_frequency);

	const gen_side_matches_thevenin_equivalents = thevenin_equivalents_of_matched_configs.gen_side_matches_thevenin_equivalents;
	const load_side_matches_thevenin_equivalents = thevenin_equivalents_of_matched_configs.load_side_matches_thevenin_equivalents;

	const voltages_load_side_port = [];

	for (let i = 0; i < gen_side_matches_thevenin_equivalents.length; i++) {
		for (let j = 0; j < load_side_matches_thevenin_equivalents.length; j++) {
			//console.log('gen_side', gen_side_matches_thevenin_equivalents[i]);
			//console.log('load_side', load_side_matches_thevenin_equivalents[j]);

			const gen_side_match_th_eq = gen_side_matches_thevenin_equivalents[i].theveninEquivalentGenSide;
			const load_side_match_th_eq = load_side_matches_thevenin_equivalents[j].theveninEquivalentLoadSide;

			let signalFlowVals = findSignalFlowNodeValues(
				{
					generator_distance: 0,
					generator_tl1_length: 0,
					generator_tl2_length: 0,
					generator_voltage_real: gen_side_match_th_eq.generator_open_circuit_thevenin_voltage.real, 
					generator_voltage_imag: gen_side_match_th_eq.generator_open_circuit_thevenin_voltage.imag, 
					generator_impedance_real: gen_side_match_th_eq.z_thevenin_looking_from_port.real, 
					generator_impedance_imag: gen_side_match_th_eq.z_thevenin_looking_from_port.imag
				},
				load_side_match_th_eq.z_thevenin_looking_from_port,
				S11,
				S21,
				S12,
				S22,
				z0_magnitude,
				beta
			);
			// console.log('signalFlowVals', signalFlowVals);
			const voltages = globalThis.convert_signal_flow_node_vals_to_voltage_current_vals(signalFlowVals, z0_magnitude);
			// console.log('voltages', voltages);
			// console.log('generator_side_total', voltages.generator_side_total);
			// console.log('load_side_total', voltages.load_side_total);
			// console.log(voltages);
			voltages_load_side_port.push({
				gen_side_match_index: i,
				load_side_match_index: j,
				total: voltages.load_side_total,
				a2: voltages.a2_voltage,
				b2: voltages.b2_voltage
			});
		}
	}

	return voltages_load_side_port;
}

globalThis.find_TL_waves_at_distance_from_current_position = (a, b, distance_away_from_port, beta) => {
	const a_at_distance =  multiplyComplexNums_v2(
		a,
		{
			real: Math.cos(beta * distance_away_from_port),
			imag: Math.sin(beta * distance_away_from_port)
		}
	);

	const b_at_distance =  multiplyComplexNums_v2(
		b,
		{
			real: Math.cos(-beta * distance_away_from_port),
			imag: Math.sin(-beta * distance_away_from_port)
		}
	);

	return {
		a: a_at_distance,
		b: b_at_distance,
		total: addComplexNums(a_at_distance, b_at_distance)
	}
}


globalThis.extract_voltage_across_load_L_match_at_port = (voltages_load_side, impedance_match, load, tl_length_load_side, z0_magnitude, beta) => {
	const z0_complex = {
		real: z0_magnitude,
		imag: 0
	}
	const z0_complex_negative = {
		real: -z0_magnitude,
		imag: 0
	}

	const series_reactance = {
		real: 0,
		imag: impedance_match.components.reactance_1 
	};
	const parallel_reactance = {
		real: 0,
		imag: impedance_match.components.reactance_2				
	}

	const b2_current = divideComplexNums_v2(
		voltages_load_side.b2,
		z0_complex_negative
	)
	const a2_current = divideComplexNums_v2(
		voltages_load_side.a2,
		z0_complex
	);
	const load_side_port_current = addComplexNums(a2_current, b2_current);
	load_side_port_current.real *= -1;
	load_side_port_current.imag *= -1;

	const load_side_shunt_current = divideComplexNums_v2(voltages_load_side.total, parallel_reactance);

	const load_side_series_current = subtractComplexNums(load_side_port_current, load_side_shunt_current);

	const voltage_across_series_reactance = multiplyComplexNums_v2(load_side_series_current, series_reactance);
	const voltage_at_load_TL_entry_on_port_side = subtractComplexNums(voltages_load_side.total, voltage_across_series_reactance);
	console.log('voltage_at_load_TL_entry_on_port_side', voltage_at_load_TL_entry_on_port_side);

	const current_at_load_TL_entry_on_port_side = load_side_series_current;
	console.log('current_at_load_TL_entry_on_port_side', current_at_load_TL_entry_on_port_side);

	//  V + Z0 * I = 2V+
	// Z0 * I = Z0 * I+ + Z0 * I- = V+ - V-
	// and then: V = V+ + V-

	const V_plus = addComplexNums(
		voltage_at_load_TL_entry_on_port_side,
		{
			real: current_at_load_TL_entry_on_port_side.real * z0_magnitude,
			imag: current_at_load_TL_entry_on_port_side.imag * z0_magnitude
		}
	)
	V_plus.real /= 2;
	V_plus.imag /= 2;

	const umatched_load_reflection = divideComplexNums(
		load.real - z0_magnitude,
		load.imag,
		load.real + z0_magnitude,
		load.imag
	);
	const umatched_load_reflection_at_port = multiplyComplexNums_v2(
		umatched_load_reflection,
		{
			real: Math.cos(-2 * beta * tl_length_load_side),
			imag: Math.sin(-2 * beta * tl_length_load_side)					
		}
	);	

	const V_minus = multiplyComplexNums_v2(V_plus, umatched_load_reflection_at_port);

	const V_plus_at_load = multiplyComplexNums_v2(
		V_plus,
		{
			real: Math.cos(-beta * tl_length_load_side),
			imag: Math.sin(-beta * tl_length_load_side)
		}
	);
	const V_minus_at_load = multiplyComplexNums_v2(
		V_minus,
		{
			real: Math.cos(beta * tl_length_load_side),
			imag: Math.sin(beta * tl_length_load_side)
		}
	);
	const voltage_across_actual_load = addComplexNums(V_plus_at_load, V_minus_at_load);
	const voltage_across_actual_load_polar = convert_complex_num_from_cartesian_to_polar(voltage_across_actual_load.real, voltage_across_actual_load.imag);
	voltage_across_actual_load.magnitude = voltage_across_actual_load_polar.magnitude;
	voltage_across_actual_load.theta = voltage_across_actual_load_polar.theta;			
	console.log('voltages_across_actual_load', voltage_across_actual_load);

	return voltage_across_actual_load;
}
globalThis.extract_voltage_across_load_T_match_at_port = (voltages_load_side, impedance_match, load, tl_length_load_side, z0_magnitude, beta) => {
	const z0_complex = {
		real: z0_magnitude,
		imag: 0
	}
	const z0_complex_negative = {
		real: -z0_magnitude,
		imag: 0
	}

	const voltage_pre_tl_at_load_port = voltages_load_side.total;

	const b2_current = divideComplexNums_v2(
		voltages_load_side.b2,
		z0_complex_negative
	)
	const a2_current = divideComplexNums_v2(
		voltages_load_side.a2,
		z0_complex
	);

	const current_pre_tl_at_load_port = addComplexNums(a2_current, b2_current);
	current_pre_tl_at_load_port.real *= -1;
	current_pre_tl_at_load_port.imag *= -1;	

	const parallel_reactance = {
		real: 0,
		imag: impedance_match.components.reactance_1
	};	
	const series_reactance = {
		real: 0,
		imag: impedance_match.components.reactance_2
	};

	const voltage_across_series_reactance = multiplyComplexNums_v2(current_pre_tl_at_load_port, series_reactance);
	const voltage_post_matching_pre_tl = subtractComplexNums(voltage_pre_tl_at_load_port, voltage_across_series_reactance);

	const current_across_shunt_reactance = divideComplexNums_v2(voltage_post_matching_pre_tl, parallel_reactance);
	const current_post_matching_pre_tl = subtractComplexNums(current_pre_tl_at_load_port, current_across_shunt_reactance);

	//  V + Z0 * I = 2V+
	// Z0 * I = Z0 * I+ + Z0 * I- = V+ - V-
	// and then: V = V+ + V-

	const V_plus = addComplexNums(
		voltage_post_matching_pre_tl,
		{
			real: current_post_matching_pre_tl.real * z0_magnitude,
			imag: current_post_matching_pre_tl.imag * z0_magnitude
		}
	)
	V_plus.real /= 2;
	V_plus.imag /= 2;

	const umatched_load_reflection = divideComplexNums(
		load.real - z0_magnitude,
		load.imag,
		load.real + z0_magnitude,
		load.imag
	);
	const umatched_load_reflection_at_port = multiplyComplexNums_v2(
		umatched_load_reflection,
		{
			real: Math.cos(-2 * beta * tl_length_load_side),
			imag: Math.sin(-2 * beta * tl_length_load_side)					
		}
	);	

	const V_minus = multiplyComplexNums_v2(V_plus, umatched_load_reflection_at_port);

	const V_plus_at_load = multiplyComplexNums_v2(
		V_plus,
		{
			real: Math.cos(-beta * tl_length_load_side),
			imag: Math.sin(-beta * tl_length_load_side)
		}
	);
	const V_minus_at_load = multiplyComplexNums_v2(
		V_minus,
		{
			real: Math.cos(beta * tl_length_load_side),
			imag: Math.sin(beta * tl_length_load_side)
		}
	);
	const voltage_across_actual_load = addComplexNums(V_plus_at_load, V_minus_at_load);
	const voltage_across_actual_load_polar = convert_complex_num_from_cartesian_to_polar(voltage_across_actual_load.real, voltage_across_actual_load.imag);
	voltage_across_actual_load.magnitude = voltage_across_actual_load_polar.magnitude;
	voltage_across_actual_load.theta = voltage_across_actual_load_polar.theta;			
	console.log('voltages_across_actual_load', voltage_across_actual_load);

	return voltage_across_actual_load;
}



globalThis.extract_voltage_across_load_L_match_at_load = (voltages_load_side, impedance_match, tl_length_load_side, z0_magnitude, beta) => {
	const z0_complex = {
		real: z0_magnitude,
		imag: 0
	}
	const z0_complex_negative = {
		real: -z0_magnitude,
		imag: 0
	}

	const voltage_post_tl_at_load_distance = find_TL_waves_at_distance_from_current_position(voltages_load_side.a2, voltages_load_side.b2, tl_length_load_side, beta);

	const b2_current = divideComplexNums_v2(
		voltage_post_tl_at_load_distance.b,
		z0_complex_negative
	)
	const a2_current = divideComplexNums_v2(
		voltage_post_tl_at_load_distance.a,
		z0_complex
	);
	const current_post_tl_at_load_distance = addComplexNums(a2_current, b2_current);
	current_post_tl_at_load_distance.real *= -1;
	current_post_tl_at_load_distance.imag *= -1;

	const series_reactance = {
		real: 0,
		imag: impedance_match.components.reactance_1
	};
	const parallel_reactance = {
		real: 0,
		imag: impedance_match.components.reactance_2
	};	

	const load_side_shunt_current = divideComplexNums_v2(voltage_post_tl_at_load_distance.total, parallel_reactance);
	const load_side_series_current = subtractComplexNums(current_post_tl_at_load_distance, load_side_shunt_current);

	const voltage_across_series_reactance = multiplyComplexNums_v2(load_side_series_current, series_reactance);

	const voltage_across_actual_load = subtractComplexNums(voltage_post_tl_at_load_distance.total, voltage_across_series_reactance);
	const voltage_across_actual_load_polar = convert_complex_num_from_cartesian_to_polar(voltage_across_actual_load.real, voltage_across_actual_load.imag);
	voltage_across_actual_load.magnitude = voltage_across_actual_load_polar.magnitude;
	voltage_across_actual_load.theta = voltage_across_actual_load_polar.theta;
	// console.log('voltages_across_actual_load', voltage_across_actual_load);

	return voltage_across_actual_load;
}
globalThis.extract_voltage_across_load_T_match_at_load = (voltages_load_side, impedance_match, tl_length_load_side, z0_magnitude, beta) => {
	const z0_complex = {
		real: z0_magnitude,
		imag: 0
	}
	const z0_complex_negative = {
		real: -z0_magnitude,
		imag: 0
	}

	const a2_post_tl_at_load = multiplyComplexNums_v2(
		voltages_load_side.a2,
		{
			real: Math.cos(beta * tl_length_load_side),
			imag: Math.sin(beta * tl_length_load_side)
		}
	);
	const b2_post_tl_at_load = multiplyComplexNums_v2(
		voltages_load_side.b2,
		{
			real: Math.cos(-beta * tl_length_load_side),
			imag: Math.sin(-beta * tl_length_load_side)
		}
	);

	const voltage_post_tl_at_load = addComplexNums(a2_post_tl_at_load, b2_post_tl_at_load);	

	const b2_current = divideComplexNums_v2(
		b2_post_tl_at_load,
		z0_complex_negative
	)
	const a2_current = divideComplexNums_v2(
		a2_post_tl_at_load,
		z0_complex
	);

	const current_post_tl_at_load = addComplexNums(a2_current, b2_current);
	current_post_tl_at_load.real *= -1;
	current_post_tl_at_load.imag *= -1;

	const series_reactance = {
		real: 0,
		imag: impedance_match.components.reactance_2
	};

	const voltage_across_series_reactance = multiplyComplexNums_v2(current_post_tl_at_load, series_reactance);
	const voltage_across_actual_load = subtractComplexNums(voltage_post_tl_at_load, voltage_across_series_reactance);
	const voltage_across_actual_load_polar = convert_complex_num_from_cartesian_to_polar(voltage_across_actual_load.real, voltage_across_actual_load.imag);
	voltage_across_actual_load.magnitude = voltage_across_actual_load_polar.magnitude;
	voltage_across_actual_load.theta = voltage_across_actual_load_polar.theta;			
	console.log('voltage_across_actual_load', voltage_across_actual_load);

	return voltage_across_actual_load;
}

globalThis.extract_voltage_across_load = (voltages_load_side_port, thevenin_equivalents_of_matched_configs, load, tl_length_load_side, frequency, z0_magnitude, beta) => {
	const voltages_across_actual_load = [];

	for (let i = 0; i < voltages_load_side_port.length; i++) {
		const voltages_load_side = voltages_load_side_port[i];
		const impedance_match = thevenin_equivalents_of_matched_configs.load_side_matches_thevenin_equivalents[voltages_load_side.load_side_match_index];
		const bileteral_match_at_port = impedance_match.bileteral_match_at_port;

		if (bileteral_match_at_port) {
			if (impedance_match.match_type === 'L-match') {
				const voltage_across_actual_load = extract_voltage_across_load_L_match_at_port(voltages_load_side, impedance_match, load, tl_length_load_side, z0_magnitude, beta);

				voltages_across_actual_load.push({
					voltage: voltage_across_actual_load,
					load_side_match_index: voltages_load_side.load_side_match_index,
					gen_side_match_index: voltages_load_side.gen_side_match_index
				});
			} else if (impedance_match.match_type === 'T-match') {
				const voltage_across_actual_load = extract_voltage_across_load_T_match_at_port(voltages_load_side, impedance_match, load, tl_length_load_side, z0_magnitude, beta);

				voltages_across_actual_load.push({
					voltage: voltage_across_actual_load,
					load_side_match_index: voltages_load_side.load_side_match_index,
					gen_side_match_index: voltages_load_side.gen_side_match_index
				});
			}
		}
		if (!bileteral_match_at_port) {
			if (impedance_match.match_type === 'L-match') {
				const voltage_across_actual_load = extract_voltage_across_load_L_match_at_load(voltages_load_side, impedance_match, tl_length_load_side, z0_magnitude, beta);

				voltages_across_actual_load.push({
					voltage: voltage_across_actual_load,
					load_side_match_index: voltages_load_side.load_side_match_index,
					gen_side_match_index: voltages_load_side.gen_side_match_index
				});
			} else if (impedance_match.match_type === 'T-match') {			
				const voltage_across_actual_load = extract_voltage_across_load_T_match_at_load(voltages_load_side, impedance_match, tl_length_load_side, z0_magnitude, beta);

				voltages_across_actual_load.push({
					voltage: voltage_across_actual_load,
					load_side_match_index: voltages_load_side.load_side_match_index,
					gen_side_match_index: voltages_load_side.gen_side_match_index
				});
			}
		}
	}

	return voltages_across_actual_load;
}

globalThis.frequency = Math.pow(10, 8);
globalThis.load_impedance = {
	real: 75,
	imag: -25
}
globalThis.generator = {
	generator_distance: 1,
	generator_tl1_length: 0.3,
	generator_tl2_length: 0.7,
	generator_voltage_real: 1, 
	generator_voltage_imag: 0, 
	generator_impedance_real: 50, 
	generator_impedance_imag: 0
}
globalThis.two_port_z_parallel_pre_series = {
	real: 100,
	imag: -50
}
globalThis.two_port_z_series = {
	real: 100,
	imag: 0
}
globalThis.two_port_z_parallel_post_series = {
	real: 50,
	imag: 100
}

// getTLWaveParams(1, 167e-9, 0, 172e-12, Math.pow(10, 9));
globalThis.tlWaveParams = getTLWaveParams(0 /* R */, 250e-9 /* L */, 0 /* G */, 100e-12 /* C */, frequency);
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

match_real_impedance_by_quarter_wave_length_lossless_TL(tlWaveParams.z0_magnitude /* same as z0_real */, 800e-9 /* L */, frequency);

match_impedance_by_quarter_wave_length_plus_reactance_cancelling_segment_lossless_TL(
	reflectionParams.reflection, 
	tlWaveParams.z0_magnitude /* same as z0_real */, 
	tlWaveParams.beta,
	800e-9 /* L */,
	frequency
);

match_impedance_by_series_reactive_element_lossless_TL(reflectionParams.reflection, tlWaveParams.z0_magnitude, tlWaveParams.beta, frequency);

match_impedance_by_shunt_reactive_element_lossless_TL(reflectionParams.reflection, tlWaveParams.z0_magnitude, tlWaveParams.beta, frequency);

const thevenin_equivalent = find_thevenin_equivalent_circuit(generator, reflectionParams.reflection, tlWaveParams.z0_magnitude, tlWaveParams.beta);

const S_params = find_S_params(
	generator,
	two_port_z_parallel_pre_series, 
	two_port_z_series, 
	two_port_z_parallel_post_series,
	tlWaveParams.z0_magnitude, 
	tlWaveParams.beta
);

/*
 	-- New section --
 	Now that it is known how to obtain S params from a two-port network between a source and a load,
 	any given set of S params can be used without it feeling like hand waving the details.
*/

frequency = Math.pow(10, 8);
generator = {
	generator_distance: 1,
	generator_tl1_length: 0.5,
	generator_tl2_length: 0.5,
	generator_voltage_real: 0.001, 
	generator_voltage_imag: 0, 
	generator_impedance_real: 50, 
	generator_impedance_imag: 0
}
load_impedance = {
	real: 50,
	imag: 0
}
globalThis.S11 = {
    real: 0.225000,
    imag: -0.389711
};
globalThis.S21 = {
    real: 0.855050,
    imag: 2.349232
};
globalThis.S12 = {
    real: 0.046985,
    imag: 0.017101
};
globalThis.S22 = {
    real: 0.303109,
    imag: -0.175000
};

let signalFlowVals = findSignalFlowNodeValues(
	generator,
	load_impedance,
	S11,
	S21,
	S12,
	S22,
	tlWaveParams.z0_magnitude,
	tlWaveParams.beta
);
// console.log(signalFlowVals);

get_generator_and_load_thevenin_circuit_components(generator, load_impedance, frequency, tlWaveParams.z0_magnitude, tlWaveParams.beta);

globalThis.V1 = { real: -2.4651624e-4, imag: -4.0180555e-4 };
globalThis.I1 = { real:  4.9686111e-6, imag: -1.1948075e-5 };
globalThis.generator_side_sim_vals = {
	voltage: V1,
	current: I1
};

globalThis.V2 = { real:  1.4592868e-3, imag:  4.6964979e-4 };
globalThis.I2 = { real: -2.9146574e-5, imag: -9.4815455e-6 };
globalThis.load_side_sim_vals = {
	voltage: V2,
	current: I2
};

const s_params_gen_side = get_s_params_from_simulated_circuit(generator_side_sim_vals, load_side_sim_vals, tlWaveParams.z0_magnitude);
S11 = s_params_gen_side.S11;
S21 = s_params_gen_side.S21;

globalThis.V1 = { real: 1.1513372e-5, imag: -3.1736097e-5 };
globalThis.I1 = { real: -2.3229474e-7, imag:  6.3408930e-7 };
globalThis.load_side_sim_vals_reverse_setup = {
	voltage: V1,
	current: I1
};

globalThis.V2 = { real: -1.2938578e-4, imag: -8.0598078e-4 };
globalThis.I2 = { real:  2.5992959e-6, imag: -3.8725388e-6 };
globalThis.generator_side_sim_vals_reverse_setup = {
	voltage: V2,
	current: I2
};

const s_params_load_side = get_s_params_from_simulated_circuit(generator_side_sim_vals_reverse_setup, load_side_sim_vals_reverse_setup, tlWaveParams.z0_magnitude, true);
S22 = s_params_load_side.S22;
S12 = s_params_load_side.S12;

signalFlowVals = findSignalFlowNodeValues(
	generator,
	load_impedance,
	S11,
	S21,
	S12,
	S22,
	tlWaveParams.z0_magnitude,
	tlWaveParams.beta
);
console.log(signalFlowVals);

const circuit_voltages = convert_signal_flow_node_vals_to_voltage_current_vals(signalFlowVals, tlWaveParams.z0_magnitude);
// console.log(circuit_voltages);

/*
const matching_impedance_generator_side = match_gammaIn_at_generator(signalFlowVals, generator, frequency, tlWaveParams.z0_magnitude, tlWaveParams.beta);
const matching_LC_components_generator_side = find_LC_components_to_obtain_target_impedance(matching_impedance_generator_side.conjugate_impedance_at_tl1_length, generator.generator_impedance_real, frequency);
const matching_LC_components_generator_side_v2 = find_series_parallel_LC_components_to_obtain_target_impedance_V2(
	matching_impedance_generator_side.conjugate_impedance_at_tl1_length, 
	{real: generator.generator_impedance_real, imag: generator.generator_impedance_imag},
	frequency
);
const matching_T_config_LC_components_generator_side = find_parallel_series_LC_components_to_obtain_target_impedance(
	matching_impedance_generator_side.conjugate_impedance_at_tl1_length, 
	{real: generator.generator_impedance_real, imag: generator.generator_impedance_imag},
	frequency
);
// console.log('matching_impedance_generator_side.conjugate_impedance_at_tl1_length', matching_impedance_generator_side.conjugate_impedance_at_tl1_length);
// console.log('matching_LC_components_generator_side', matching_LC_components_generator_side);
// console.log('matching_LC_components_generator_side_v2', matching_LC_components_generator_side_v2);
// console.log('matching_T_config_LC_components_generator_side', matching_T_config_LC_components_generator_side);
const matching_impedance_load_side = match_gammaOut_at_load(signalFlowVals, generator, frequency, tlWaveParams.z0_magnitude, tlWaveParams.beta);
const matching_LC_components_load_side = find_LC_components_to_obtain_target_impedance(matching_impedance_load_side.conjugate_impedance_at_tl2_length, load_impedance.real, frequency);
const matching_LC_components_load_side_v2 = find_series_parallel_LC_components_to_obtain_target_impedance_V2(
	matching_impedance_load_side.conjugate_impedance_at_tl2_length, 
	{real: load_impedance.real, imag: load_impedance.imag},
	frequency
);
const matching_T_config_LC_components_load_side = find_parallel_series_LC_components_to_obtain_target_impedance(
	matching_impedance_load_side.conjugate_impedance_at_tl2_length, 
	{real: load_impedance.real, imag: load_impedance.imag},
	frequency
);
// console.log('matching_impedance_load_side', matching_impedance_load_side);
// console.log('matching_LC_components_load_side', matching_LC_components_load_side);
// console.log('matching_LC_components_load_side_v2', matching_LC_components_load_side_v2);
// console.log('matching_T_config_LC_components_load_side', matching_T_config_LC_components_load_side);
*/

/*let bileteral_match_at_port = false;
console.log('bileteral_match_at_port', bileteral_match_at_port);
let bilateral_matching = find_bilateral_match_numerically(generator, load_impedance, S11, S21, S12, S22, bileteral_match_at_port, frequency, tlWaveParams.z0_magnitude, tlWaveParams.beta);
let thevenin_equivalents_of_matched_configs = globalThis.get_thevenin_equivalents_of_matching_configs(bilateral_matching, bileteral_match_at_port, generator, load_impedance, frequency, frequency, tlWaveParams.z0_magnitude, tlWaveParams.beta);*/

bileteral_match_at_port = false;
console.log('bileteral_match_at_port', bileteral_match_at_port);
bilateral_matching = find_bilateral_match_numerically(generator, load_impedance, S11, S21, S12, S22, bileteral_match_at_port, frequency, tlWaveParams.z0_magnitude, tlWaveParams.beta);
thevenin_equivalents_of_matched_configs = globalThis.get_thevenin_equivalents_of_matching_configs(bilateral_matching, bileteral_match_at_port, generator, load_impedance, frequency, frequency, tlWaveParams.z0_magnitude, tlWaveParams.beta);

const voltages_load_side_port = get_load_voltage_for_impedance_matched_configs(thevenin_equivalents_of_matched_configs, bilateral_matching, S11, S21, S12, S22, frequency, frequency, tlWaveParams.z0_magnitude, tlWaveParams.beta);

const voltages_across_actual_load = globalThis.extract_voltage_across_load(voltages_load_side_port, thevenin_equivalents_of_matched_configs, load_impedance, generator.generator_tl2_length, frequency, tlWaveParams.z0_magnitude, tlWaveParams.beta);
console.log(voltages_across_actual_load);
