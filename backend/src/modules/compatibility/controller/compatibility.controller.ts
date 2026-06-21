import { Request, Response } from 'express';
import { KootaService, NAKSHATRA_TABLE } from '../service/koota.service';
import { generateCompatibilityPDF } from '../services/compatibility.pdf.service';
import { AuthRequest } from '../../../middlewares/auth.middleware';
import { User } from '../../user/model/user.model';
import { UserUsage } from '../../subscription/model/subscription.model';

const getDeterministicNakshatra = (data: any) => {
    const nakshatras = Object.keys(NAKSHATRA_TABLE);
    const seed = (data.name?.length || 0) + (new Date(data.dateOfBirth).getDate() || 0);
    return NAKSHATRA_TABLE[nakshatras[seed % nakshatras.length]];
};

const detectDoshas = (boyN: any, girlN: any, gunaMilan: any) => {
    const doshas = [];

    if (boyN.nadi === girlN.nadi) {
        doshas.push({
            dosha_name: "Nadi Dosha",
            severity: "High",
            description: "Both individuals have the same Nadi (energetic life-current). Traditionally considered the most serious dosha, it indicates a risk for health compatibility and progeny wellbeing. Classical texts prescribe specific pujas and mantras before marriage.",
            classical_reference: "Nadi Dosha is cited as the gravest of all Ashta Koota doshas in Brihat Parashara Hora Shastra. When Nadi scores 0 (same Nadi for both partners), it outweighs all other koota scores and requires mandatory remedial attention.",
            cancellable: true
        });
    }

    if (gunaMilan.koota_breakdown.find((k: any) => k.koota === "Bhakut")?.score === 0) {
        doshas.push({
            dosha_name: "Bhakut Dosha",
            severity: "Medium",
            description: "The relative positions of the Moon signs are in a 2/12, 5/9 or 6/8 configuration. Bhakut Dosha is associated with financial instability, emotional distance, or challenges in family planning. However, it is cancellable under several classical conditions.",
            classical_reference: "Bhakut Dosha arises when the two Moon signs create specific adverse angular relationships (2nd-12th, 5th-9th, or 6th-8th). The Muhurta Chintamani and Vivah Patal detail its cancellation conditions.",
            cancellable: true
        });
    }

    return doshas;
};

export const compatibilityController = {
    async analyze(req: Request, res: Response) {
        try {
            const { boy, girl } = req.body;

            if (!boy || !girl) {
                res.status(400).json({ success: false, message: 'Boy and Girl details are required.' });
                return;
            }

            const boyN = getDeterministicNakshatra(boy);
            const girlN = getDeterministicNakshatra(girl);

            const gunaMilan = KootaService.analyze(boyN, girlN);
            const doshas = detectDoshas(boyN, girlN, gunaMilan);
            const remedy_triggers = doshas.map(d => ({ dosha: d.dosha_name, severity: d.severity }));

            res.json({
                success: true,
                guna_milan: gunaMilan,
                boy_details: {
                    name: boy.name,
                    nakshatra: boyN.name,
                    rasi: boyN.rashi_english,
                    moon_nakshatra: boyN.name,
                    rashi: boyN.rashi,
                    rashi_english: boyN.rashi_english,
                },
                girl_details: {
                    name: girl.name,
                    nakshatra: girlN.name,
                    rasi: girlN.rashi_english,
                    moon_nakshatra: girlN.name,
                    rashi: girlN.rashi,
                    rashi_english: girlN.rashi_english,
                },
                koota_details: Object.fromEntries(
                    gunaMilan.koota_breakdown.map(k => [
                        k.koota.toLowerCase(),
                        { description: k.description, received: k.score, max: k.max_score, passed: k.passed }
                    ])
                ),
                doshas,
                remedy_triggers,
            });

        } catch (error) {
            console.error('Compatibility Analysis error:', error);
            res.status(500).json({ success: false, message: 'Internal server error during analysis.' });
        }
    },

    async generateReport(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Authentication required.' });
                return;
            }

            // Check for premium plan or one-time purchase of 'compatibility-report'
            const [user, usage] = await Promise.all([
                User.findById(userId).select('role purchasedFeatures'),
                UserUsage.findOne({ userId }).select('plan planEndDate'),
            ]);

            const isAdmin = user?.role === 'admin';
            const hasPurchased = user?.purchasedFeatures?.includes('compatibility-report');
            const isPremium = usage?.plan === 'premium' && (!usage.planEndDate || new Date() <= usage.planEndDate);

            if (!isAdmin && !hasPurchased && !isPremium) {
                res.status(403).json({
                    success: false,
                    message: 'The Full Compatibility Report requires a VedicScan Premium subscription or a one-time purchase.',
                    detail: {
                        type: 'feature_locked',
                        feature: 'compatibility-report',
                        upgrade_url: '/subscription',
                    },
                });
                return;
            }

            const { boy, girl } = req.body;
            if (!boy || !girl) {
                res.status(400).json({ success: false, message: 'Boy and Girl details are required.' });
                return;
            }

            const boyN = getDeterministicNakshatra(boy);
            const girlN = getDeterministicNakshatra(girl);
            const gunaMilan = KootaService.analyze(boyN, girlN);
            const doshas = detectDoshas(boyN, girlN, gunaMilan);

            const pdfBuffer = await generateCompatibilityPDF({
                boy,
                girl,
                boyNakshatra: boyN,
                girlNakshatra: girlN,
                gunaMilan,
                doshas,
            });

            const groomName = (boy.name || 'Groom').replace(/[^a-zA-Z0-9]/g, '-');
            const brideName = (girl.name || 'Bride').replace(/[^a-zA-Z0-9]/g, '-');
            const filename = `VedicScan-Compatibility-${groomName}-${brideName}.pdf`;

            res.json({
                success: true,
                pdf: pdfBuffer.toString('base64'),
                filename,
                pages: 9,
                generated_at: new Date().toISOString(),
            });

        } catch (error) {
            console.error('Compatibility Report generation error:', error);
            res.status(500).json({ success: false, message: 'Report generation failed. Please try again.' });
        }
    },
};
