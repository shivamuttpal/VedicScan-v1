import { Request, Response } from 'express';
import { KootaService, NAKSHATRA_TABLE } from '../service/koota.service';

export const compatibilityController = {
    async analyze(req: Request, res: Response) {
        try {
            const { boy, girl } = req.body;

            if (!boy || !girl) {
                res.status(400).json({ success: false, message: 'Boy and Girl details are required.' });
                return;
            }

            // In a real system, we would calculate the actual Nakshatras using Swiss Ephemeris.
            // For now, we deterministicly pick a Nakshatra based on the name/date to give varied results.
            const getDeterministicNakshatra = (data: any) => {
                const nakshatras = Object.keys(NAKSHATRA_TABLE);
                const seed = (data.name?.length || 0) + (new Date(data.dateOfBirth).getDate() || 0);
                return NAKSHATRA_TABLE[nakshatras[seed % nakshatras.length]];
            };

            const boyN = getDeterministicNakshatra(boy);
            const girlN = getDeterministicNakshatra(girl);

            const gunaMilan = KootaService.analyze(boyN, girlN);

            // Detect Doshas
            const doshas = [];
            
            // Nadi Dosha check
            if (boyN.nadi === girlN.nadi) {
                doshas.push({
                    dosha_name: "Nadi Dosha",
                    severity: "High",
                    description: "Both individuals have the same Nadi (genetics). Traditionally considered a risk for progeny and health compatibility.",
                    classical_reference: "Nadi Dosha is the most critical among Ashta-Koota factors.",
                    cancellable: true
                });
            }

            // Bhakut Dosha check
            if (gunaMilan.koota_breakdown.find(k => k.koota === "Bhakut")?.score === 0) {
              doshas.push({
                  dosha_name: "Bhakut Dosha",
                  severity: "Medium",
                  description: "The relative positions of the Moon signs are in a 2/12, 5/9 or 6/8 configuration.",
                  classical_reference: "Can lead to emotional distance or financial instability.",
                  cancellable: true
              });
            }

            // Remedy Triggers
            const remedy_triggers = doshas.map(d => ({
                dosha: d.dosha_name,
                severity: d.severity
            }));

            res.json({
                success: true,
                guna_milan: gunaMilan,
                boy: {
                    name: boy.name,
                    moon_nakshatra: boyN.name,
                    rashi: boyN.rashi,
                    rashi_english: boyN.rashi_english
                },
                girl: {
                    name: girl.name,
                    moon_nakshatra: girlN.name,
                    rashi: girlN.rashi,
                    rashi_english: girlN.rashi_english
                },
                doshas,
                remedy_triggers
            });

        } catch (error) {
            console.error('Compatibility Analysis error:', error);
            res.status(500).json({ success: false, message: 'Internal server error during analysis.' });
        }
    }
};
