globalThis.get_port_source_and_load_components_to_use_in_sim = (thevenin_equivalents_of_matched_configs, generator, load, frequency, z0_magnitude, beta) => {
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

	const gen_side = thevenin_equivalents_of_matched_configs.gen_side_matches_thevenin_equivalents;

	for (let i = 0; i < gen_side.length; i++) {
		const gen_side_match = gen_side[i];

		gen_side_match.theveninEquivalentGenSide.z_thevenin_comps_looking_from_port = getRLCValsForImpedance(gen_side_match.theveninEquivalentGenSide.z_thevenin_looking_from_port, frequency);

		if (gen_side_match.bileteral_match_at_port) {
			gen_side_match.fixed_z_source_at_port = z_gen_port;
			gen_side_match.fixed_z_load_at_port_comp = getRLCValsForImpedance(z_gen_port, frequency);			
		} else {
			const reactance1_at_port = get_impedance_across_TL_distance_from_port(
				{ real: 0, imag: gen_side_match.components.reactance_1 }, 
				generator.generator_tl1_length, 
				z0_magnitude, 
				beta
			);
			gen_side_match.components.matching_reactive_comp_1_at_port = getRLCValsForImpedance(
				reactance1_at_port,
				frequency
			);
			const reactance2_at_port = get_impedance_across_TL_distance_from_port(
				{ real: 0, imag: gen_side_match.components.reactance_2 }, 
				generator.generator_tl1_length, 
				z0_magnitude, 
				beta
			);			
			gen_side_match.components.matching_reactive_comp_2_at_port = getRLCValsForImpedance(
				reactance2_at_port,
				frequency
			);
		}
	}

	const load_side = thevenin_equivalents_of_matched_configs.load_side_matches_thevenin_equivalents;

	for (let i = 0; i < load_side.length; i++) {
		const load_side_match = load_side[i];

		load_side_match.theveninEquivalentLoadSide.z_thevenin_comps_looking_from_port = getRLCValsForImpedance(load_side_match.theveninEquivalentLoadSide.z_thevenin_looking_from_port, frequency);		

		if (load_side_match.bileteral_match_at_port) {
			load_side_match.fixed_z_load_at_port = z_load_port;
			load_side_match.fixed_z_load_at_port_comp = getRLCValsForImpedance(z_load_port, frequency);
		} else {
			const reactance1_at_port = get_impedance_across_TL_distance_from_port(
				{ real: 0, imag: load_side_match.components.reactance_1 }, 
				generator.generator_tl2_length, 
				z0_magnitude, 
				beta
			);
			load_side_match.components.matching_reactive_comp_1_at_port = getRLCValsForImpedance(
				reactance1_at_port,
				frequency
			);
			const reactance2_at_port = get_impedance_across_TL_distance_from_port(
				{ real: 0, imag: load_side_match.components.reactance_2 }, 
				generator.generator_tl2_length, 
				z0_magnitude, 
				beta
			);			
			load_side_match.components.matching_reactive_comp_2_at_port = getRLCValsForImpedance(
				reactance2_at_port,
				frequency
			);	
		}
	}

	return thevenin_equivalents_of_matched_configs;
}