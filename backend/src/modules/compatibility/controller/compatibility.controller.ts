import { Request, Response } from 'express';
import { KootaService, NAKSHATRA_TABLE } from '../service/koota.service';
import { calculateNakshatra } from '../service/astronomical';
import { generateCompatibilityPDF } from '../services/compatibility.pdf.service';
import { getMarsContext, MarsContext } from '../../chart/services/chartEngine.service';
import { AuthRequest } from '../../../middlewares/auth.middleware';
import { User } from '../../user/model/user.model';
import { UserUsage } from '../../subscription/model/subscription.model';
import { PAYMENTS_ENABLED } from '../../../config/plans';

/**
 * Resolve Janma Nakshatra for a person using the Moon's actual astronomical
 * position at the time of birth (Jean Meeus algorithm + Lahiri ayanamsa).
 *
 * Falls back to a simple deterministic seed only when dateOfBirth is missing.
 */
const getNakshatraForPerson = (data: any) => {
    if (data.dateOfBirth) {
        const name = calculateNakshatra(
            data.dateOfBirth,
            data.timeOfBirth || '12:00',
            data.placeOfBirth || 'India',
        );
        if (name && NAKSHATRA_TABLE[name]) return NAKSHATRA_TABLE[name];
    }
    // Fallback: deterministic seed (used only when date is absent)
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

// Houses (from Lagna) that place Mars in a Manglik/Kuja Dosha position.
const MANGAL_DOSHA_HOUSES = [1, 2, 4, 7, 8, 12];
// Mars in own/exalted sign softens the dosha.
const MARS_STRONG_SIGNS = ['Aries', 'Scorpio', 'Capricorn'];

const isManglik = (mars: MarsContext | null) =>
    !!mars && MANGAL_DOSHA_HOUSES.includes(mars.house);

/**
 * Detect Mangal (Kuja) Dosha for the couple using each person's actual Mars
 * house position (computed via the sidereal chart engine). Best-effort: if a
 * chart cannot be computed the person is treated as "unknown" and no false
 * dosha is reported. Applies the classical mutual-cancellation rule (when BOTH
 * partners are Manglik the dosha is neutralised).
 */
const detectManglikDoshas = async (boy: any, girl: any) => {
    const [boyMars, girlMars] = await Promise.all([
        getMarsContext(boy),
        getMarsContext(girl),
    ]);

    const boyManglik = isManglik(boyMars);
    const girlManglik = isManglik(girlMars);
    if (!boyManglik && !girlManglik) return [];

    const bothManglik = boyManglik && girlManglik;
    const strong = (m: MarsContext | null) => !!m && MARS_STRONG_SIGNS.includes(m.rashi);

    // Severity: mutual cancellation → Low; Mars in 7th/8th → High; else Medium.
    // Own/exalted Mars softens by one level.
    let severity: 'High' | 'Medium' | 'Low';
    if (bothManglik) {
        severity = 'Low';
    } else {
        const m = boyManglik ? boyMars! : girlMars!;
        const heavy = m.house === 7 || m.house === 8;
        severity = heavy ? (strong(m) ? 'Medium' : 'High') : 'Medium';
    }

    const who = bothManglik ? 'Both partners' : (boyManglik ? (boy.name || 'The groom') : (girl.name || 'The bride'));
    const houseOf = (m: MarsContext | null) => (m ? `${m.house}th house` : '');

    let description: string;
    if (bothManglik) {
        description = `${boy.name || 'The groom'} has Mars in the ${houseOf(boyMars)} and ${girl.name || 'the bride'} has Mars in the ${houseOf(girlMars)} — both partners are Manglik. Classically, when both individuals carry Mangal Dosha the affliction is mutually neutralised (Manglik–Manglik cancellation), and the union is considered safe from the dosha's adverse effects.`;
    } else {
        const m = boyManglik ? boyMars! : girlMars!;
        description = `${who} is Manglik — Mars is placed in the ${houseOf(m)} from the Lagna, one of the positions (1, 2, 4, 7, 8, 12) that create Mangal Dosha. As only one partner is Manglik, classical texts advise remedial measures before marriage to balance the Mars energy.${strong(m) ? ' Partial cancellation applies as Mars is in its own or exalted sign.' : ''}`;
    }

    return [{
        dosha_name: 'Mangal Dosha',
        severity,
        description,
        classical_reference: 'Mangal (Kuja) Dosha is assessed from the placement of Mars relative to the Lagna (and, in stricter analysis, the Moon and Venus). Mars in the 1st, 2nd, 4th, 7th, 8th or 12th house is held to stress marital harmony. Brihat Parashara Hora Shastra and Muhurta texts note mutual cancellation when both partners are Manglik, and softening when Mars occupies its own or exalted sign.',
        cancellable: true,
    }];
};

export const compatibilityController = {
    async analyze(req: Request, res: Response) {
        try {
            const { boy, girl } = req.body;

            if (!boy || !girl) {
                res.status(400).json({ success: false, message: 'Boy and Girl details are required.' });
                return;
            }

            const boyN = getNakshatraForPerson(boy);
            const girlN = getNakshatraForPerson(girl);

            const gunaMilan = KootaService.analyze(boyN, girlN);
            const doshas = detectDoshas(boyN, girlN, gunaMilan);
            // Manglik (Kuja Dosha) — requires each person's Mars house from the
            // full chart engine. Best-effort so a chart failure never breaks the
            // koota result (which is what the old code always returned).
            const manglikDoshas = await detectManglikDoshas(boy, girl);
            doshas.push(...manglikDoshas);
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

            // TEMP: payments disabled — skip the premium/purchase gate entirely.
            if (PAYMENTS_ENABLED) {
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
            }

            const { boy, girl, lang } = req.body;
            if (!boy || !girl) {
                res.status(400).json({ success: false, message: 'Boy and Girl details are required.' });
                return;
            }

            const boyN = getNakshatraForPerson(boy);
            const girlN = getNakshatraForPerson(girl);
            const gunaMilan = KootaService.analyze(boyN, girlN);
            const doshas = detectDoshas(boyN, girlN, gunaMilan);
            const manglikDoshas = await detectManglikDoshas(boy, girl);
            doshas.push(...manglikDoshas);

            const pdfBuffer = await generateCompatibilityPDF({
                boy,
                girl,
                boyNakshatra: boyN,
                girlNakshatra: girlN,
                lang: lang === 'hi' ? 'hi' : 'en',
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
                pages: 11,
                generated_at: new Date().toISOString(),
            });

        } catch (error: any) {
            console.error('Compatibility Report generation error:', error);
            res.status(500).json({
                success: false,
                message: 'Report generation failed. Please try again.',
                debug: String(error?.message || error),
            });
        }
    },
};
