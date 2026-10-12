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
