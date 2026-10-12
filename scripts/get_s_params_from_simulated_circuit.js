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