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
