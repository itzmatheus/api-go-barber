import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';

import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';

import Notification from '../schemas/Notification';

class AppointmentController {

    async index(req, res) {

        const { page = 1 } = req.query;

        const appointments = await Appointment.findAll({
            where: { user_id: req.userId, canceled_at: null },
            order: ['date'],
            attributes: ['id', 'date'],
            limit: 20,
            offset: (page - 1)* 20,
            include: [
                {
                    model: User,
                    as: 'provider',
                    attributes: ['id', 'name'],
                    include: [
                        {
                            model: File,
                            as: 'avatar',
                            attributes: ['id', 'path', 'url'],
                        }
                    ]
                }
            ]
        });

        return res.json(appointments);
    }

    async store(req, res) {

        const schema = Yup.object().shape({
            date: Yup.date().required(),
            provider_id: Yup.number().required(),
        });

        if(!(await schema.isValid(req.body))) {
           return res.status(400).json('Validation fails');
        }

        const { provider_id, date } = req.body;

        /**
        * Check if provider_id is a provider
        */
       const isProvider = await User.findOne({
               where: { id: provider_id, provider: true },
        })

        if (!isProvider) {
            return res.status(401).json({ error: 'You can only create  appointments with providers' });
        }

        /**
         * Verify if provider is not the same person creating appointment
         */
        if (provider_id === req.userId) {
            return res.status(401).json({
                error: "You don't have permission create appointment to yourself"
            });
        }


        /**
        * Check for past dates
        */
        const hourStart = startOfHour(parseISO(date));

        if (isBefore(hourStart, new Date())) {
            return res.status(400).json({ error: 'Past dates are not permitted' });
        }

        /**
         * Check date availability
        */

        const checkAvailability = await Appointment.findOne({
            where: {
                provider_id,
                canceled_at: null,
                date: hourStart,
            }
        });

        if (checkAvailability) {
            return res.status(400).json({ error: 'Appointment date is not available' });
        }

        const appointment = await Appointment.create({
            user_id: req.userId,
            provider_id,
            date: hourStart,
        })

        /**
         * Notify appointment provider
         */

        const user = await User.findByPk(req.userId);
        const formattedDate = format(
            hourStart,
            "'dia' dd 'de' MMMM', às' H:mm'h'",
            { locale: pt },
        );

        await Notification.create({
            content: `Novo agendamento de(a) ${user.name} para o ${formattedDate}`,
            user: provider_id,
        });

        return res.json(appointment);
    }

    async delete(req, res) {

        const appointment = await Appointment.findByPk(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                error: "Cannot find appointment"
            });           
        }

        if (appointment.user_id !== req.userId) {
            return res.status(401).json({
                error: "You don't have permission to cancel this appointment"
            });
        }

        const dateWithSub = subHours(appointment.date, 2);

        /**
         * Verify if the appointment date (- 2 hours) is before the current time
         */

        if (isBefore(dateWithSub, new Date())){
            return res.status(401).json({
                error: "You can only cancel appointments 2 hours in advance"
            });           
        }

        appointment.canceled_at = new Date();
        await appointment.save();

        return res.json(appointment);
    }

}

export default new AppointmentController();