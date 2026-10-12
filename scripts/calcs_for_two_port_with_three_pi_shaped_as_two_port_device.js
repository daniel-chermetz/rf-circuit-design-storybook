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