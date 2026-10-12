globalThis.get_impedance_across_TL_distance_from_port = (z, distance, z0_magnitude, beta) => {
	const z0_complex = {
		real: z0_magnitude,
		imag: 0
	}

	const reflection = divideComplexNums(
		z.real - z0_magnitude,
		z.imag,
		z.real + z0_magnitude,
		z.imag
	);

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

	return multiplyComplexNums_v2(impedance_to_z0_ratio_at_distance, z0_complex)
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

globalThis.find_bilateral_match_numerically = (generator, load, S11, S21, S12, S22, use_port_LC_components, frequency, z0_magnitude, beta) => {
	const generator_with_evolving_impedance = Object.assign({}, generator);
	const load_with_evolving_impedance = Object.assign({}, load);

	const z_gen = {
		real: generator.generator_impedance_real,
		imag: generator.generator_impedance_imag
	};
	const z_gen_port = get_impedance_across_TL_distance_from_port(z_gen, generator.generator_tl1_length, z0_magnitude, beta);

	const z_load = {
		real: load.real,
		imag: load.imag
	}
	const z_load_port = get_impedance_across_TL_distance_from_port(z_load, generator.generator_tl2_length, z0_magnitude, beta);


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

	const matching_LC_components_generator_side_v2 = find_series_parallel_LC_components_to_obtain_target_impedance_V2(
		use_port_LC_components ? matching_impedance_generator_side.conjugate_impedance_at_tl1_length : matching_impedance_generator_side.conjugate_impedance_at_generator, 
		use_port_LC_components ? z_gen_port : z_gen,
		frequency
	);
	const matching_T_config_LC_components_generator_side = find_parallel_series_LC_components_to_obtain_target_impedance(
		use_port_LC_components ? matching_impedance_generator_side.conjugate_impedance_at_tl1_length : matching_impedance_generator_side.conjugate_impedance_at_generator,
		use_port_LC_components ? z_gen_port : z_gen,
		frequency
	);

	const matching_LC_components_load_side_v2 = find_series_parallel_LC_components_to_obtain_target_impedance_V2(
		use_port_LC_components ? matching_impedance_load_side.conjugate_impedance_at_tl2_length : matching_impedance_load_side.conjugate_impedance_at_load, 
		use_port_LC_components ? z_load_port : z_load,
		frequency
	);
	const matching_T_config_LC_components_load_side = find_parallel_series_LC_components_to_obtain_target_impedance(
		use_port_LC_components ? matching_impedance_load_side.conjugate_impedance_at_tl2_length : matching_impedance_load_side.conjugate_impedance_at_load,
		use_port_LC_components ? z_load_port : z_load,
		frequency
	);

	return {
		matching_impedance_generator_side,
		matching_impedance_load_side,
		
		matching_LC_components_generator_side_v2,
		matching_T_config_LC_components_generator_side,
		
		matching_LC_components_load_side_v2,
		matching_T_config_LC_components_load_side,

		allMatchingConfigs: {
			port: {
				generator: {
					L_config_LC_comps: find_series_parallel_LC_components_to_obtain_target_impedance_V2(
						matching_impedance_generator_side.conjugate_impedance_at_tl1_length,
						z_gen_port,
						frequency
					),
					T_config_LC_comps: find_parallel_series_LC_components_to_obtain_target_impedance(
						matching_impedance_generator_side.conjugate_impedance_at_tl1_length,
						z_gen_port,
						frequency
					)
				},
				load: {
					L_config_LC_comps: find_series_parallel_LC_components_to_obtain_target_impedance_V2(
						matching_impedance_load_side.conjugate_impedance_at_tl2_length,
						z_load_port,
						frequency
					),
					T_config_LC_comps: find_parallel_series_LC_components_to_obtain_target_impedance(
						matching_impedance_load_side.conjugate_impedance_at_tl2_length,
						z_load_port,
						frequency
					)					
				}
			},
			generator_load: {
				generator: {
					L_config_LC_comps: find_series_parallel_LC_components_to_obtain_target_impedance_V2(
						matching_impedance_generator_side.conjugate_impedance_at_generator,
						z_gen,
						frequency
					),
					T_config_LC_comps: find_parallel_series_LC_components_to_obtain_target_impedance(
						matching_impedance_generator_side.conjugate_impedance_at_generator,
						z_gen,
						frequency
					)
				},
				load: {
					L_config_LC_comps: find_series_parallel_LC_components_to_obtain_target_impedance_V2(
						matching_impedance_load_side.conjugate_impedance_at_load,
						z_load,
						frequency
					),
					T_config_LC_comps: find_parallel_series_LC_components_to_obtain_target_impedance(
						matching_impedance_load_side.conjugate_impedance_at_load,
						z_load,
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
			const theveninEquivalentGenSide = find_thevenin_equivalent_circuit_with_T_matching_network(
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
			const theveninEquivalentGenSide = find_thevenin_equivalent_circuit_with_T_matching_network(
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
			const theveninEquivalentLoadSide = find_thevenin_equivalent_circuit_with_T_matching_network(
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
			const theveninEquivalentLoadSide = find_thevenin_equivalent_circuit_with_T_matching_network(
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
			const voltages = convert_signal_flow_node_vals_to_voltage_current_vals(signalFlowVals, z0_magnitude);
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
