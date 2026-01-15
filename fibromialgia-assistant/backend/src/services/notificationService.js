const { supabase } = require("../config/supabase");
const whatsappService = require("./whatsappService");
const logger = require("../utils/logger");
const emailService = require("./emailService");

/**
 * Cria uma nova notificação
 * @param {Object} notification - Dados da notificação
 * @returns {Promise<Object>} Notificação criada
 */
async function createNotification(notification) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: notification.user_id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          status: "pending",
          scheduled_for: notification.scheduled_for,
          metadata: notification.metadata || {},
        },
      ])
      .select()
      .single();

    if (error) throw error;

    logger.info("Notificação criada:", { id: data.id, type: data.type });
    return data;
  } catch (error) {
    logger.error("Erro ao criar notificação:", error);
    throw error;
  }
}

/**
 * Envia uma notificação
 * @param {string} notificationId - ID da notificação
 * @returns {Promise<Object>} Notificação atualizada
 */
async function sendNotification(notificationId) {
  try {
    // Buscar notificação
    const { data: notification, error: fetchError } = await supabase
      .from("notifications")
      .select("*, users!inner(phone)")
      .eq("id", notificationId)
      .single();

    if (fetchError) throw fetchError;

    // Enviar mensagem via WhatsApp
    const messageId = await whatsappService.sendTextMessage(
      notification.users.phone,
      `${notification.title}\n\n${notification.message}`
    );

    // Atualizar status da notificação
    const { data: updated, error: updateError } = await supabase
      .from("notifications")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        message_id: messageId,
        metadata: {
          ...notification.metadata,
          sent_via: "whatsapp",
        },
      })
      .eq("id", notificationId)
      .select()
      .single();

    if (updateError) throw updateError;

    logger.info("Notificação enviada:", {
      id: notificationId,
      message_id: messageId,
    });
    return updated;
  } catch (error) {
    // Atualizar status para erro
    await supabase
      .from("notifications")
      .update({
        status: "error",
        error_message: error.message,
        metadata: {
          ...notification.metadata,
          error: error.message,
        },
      })
      .eq("id", notificationId);

    logger.error("Erro ao enviar notificação:", error);
    throw error;
  }
}

/**
 * Agenda uma notificação
 * @param {Object} notification - Dados da notificação
 * @returns {Promise<Object>} Notificação agendada
 */
async function scheduleNotification(notification) {
  try {
    const scheduledNotification = await createNotification({
      ...notification,
      status: "scheduled",
    });

    logger.info("Notificação agendada:", { id: scheduledNotification.id });
    return scheduledNotification;
  } catch (error) {
    logger.error("Erro ao agendar notificação:", error);
    throw error;
  }
}

/**
 * Lista notificações
 * @param {Object} filters - Filtros para a busca
 * @returns {Promise<Array>} Lista de notificações
 */
async function listNotifications(filters = {}) {
  try {
    let query = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    // Aplicar filtros
    if (filters.user_id) {
      query = query.eq("user_id", filters.user_id);
    }

    if (filters.type) {
      query = query.eq("type", filters.type);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.start_date) {
      query = query.gte("created_at", filters.start_date);
    }

    if (filters.end_date) {
      query = query.lte("created_at", filters.end_date);
    }

    // Paginação
    if (filters.page && filters.limit) {
      const start = (filters.page - 1) * filters.limit;
      query = query.range(start, start + filters.limit - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error("Erro ao listar notificações:", error);
    throw error;
  }
}

/**
 * Obtém detalhes de uma notificação
 * @param {string} notificationId - ID da notificação
 * @returns {Promise<Object>} Detalhes da notificação
 */
async function getNotificationDetails(notificationId) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*, users!inner(name, phone)")
      .eq("id", notificationId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error("Erro ao obter detalhes da notificação:", error);
    throw error;
  }
}

/**
 * Cancela uma notificação
 * @param {string} notificationId - ID da notificação
 * @returns {Promise<Object>} Notificação cancelada
 */
async function cancelNotification(notificationId) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .select()
      .single();

    if (error) throw error;

    logger.info("Notificação cancelada:", { id: notificationId });
    return data;
  } catch (error) {
    logger.error("Erro ao cancelar notificação:", error);
    throw error;
  }
}

/**
 * Processa notificações agendadas
 * @returns {Promise<void>}
 */
async function processScheduledNotifications() {
  try {
    const now = new Date().toISOString();

    // Buscar notificações agendadas
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_for", now);

    if (error) throw error;

    // Processar cada notificação
    for (const notification of notifications) {
      try {
        await sendNotification(notification.id);
      } catch (error) {
        logger.error(
          `Erro ao processar notificação ${notification.id}:`,
          error
        );
      }
    }

    logger.info("Processamento de notificações agendadas concluído");
  } catch (error) {
    logger.error("Erro ao processar notificações agendadas:", error);
    throw error;
  }
}

/**
 * Notifica administradores sobre um evento
 * @param {Object} notification Dados da notificação
 * @param {string} notification.type Tipo da notificação (alert, report, system)
 * @param {string} notification.title Título da notificação
 * @param {string} notification.message Mensagem da notificação
 * @param {Object} notification.details Detalhes adicionais
 */
async function notifyAdmins(notification) {
  try {
    // Obter todos os administradores
    const { data: admins, error } = await supabase
      .from("users_livia")
      .select("id, name, email, phone")
      .eq("role", "admin")
      .eq("status", "active");

    if (error) throw error;

    logger.info(`Notificando ${admins.length} administradores`);

    // Registrar notificação no banco de dados
    const { error: insertError } = await supabase.from("notifications").insert([
      {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        details: notification.details,
        created_at: new Date().toISOString(),
      },
    ]);

    if (insertError) throw insertError;

    // Enviar notificação para cada administrador
    await Promise.all(
      admins.map(async (admin) => {
        try {
          // Enviar por e-mail
          if (admin.email) {
            await emailService.sendEmail({
              to: admin.email,
              subject: notification.title,
              text: notification.message,
              html: formatEmailNotification(notification, admin),
            });
          }

          // Enviar por WhatsApp
          if (admin.phone) {
            await whatsappService.sendTextMessage(
              admin.phone,
              formatWhatsAppNotification(notification, admin)
            );
          }

          logger.info(`Notificação enviada para administrador ${admin.id}`);
        } catch (error) {
          logger.error(
            `Erro ao enviar notificação para administrador ${admin.id}:`,
            error
          );
          // Continuar com o próximo administrador
        }
      })
    );

    logger.info("Notificações enviadas com sucesso");
  } catch (error) {
    logger.error("Erro ao notificar administradores:", error);
    throw error;
  }
}

/**
 * Formata notificação para e-mail
 * @param {Object} notification Dados da notificação
 * @param {Object} admin Dados do administrador
 * @returns {string} HTML formatado
 */
function formatEmailNotification(notification, admin) {
  return `
    <h1>${notification.title}</h1>
    <p>Olá, ${admin.name || "Administrador"}!</p>
    <p>${notification.message}</p>
    ${formatNotificationDetails(notification.details)}
    <p>Atenciosamente,<br>Sistema de Monitoramento</p>
  `;
}

/**
 * Formata notificação para WhatsApp
 * @param {Object} notification Dados da notificação
 * @param {Object} admin Dados do administrador
 * @returns {string} Texto formatado
 */
function formatWhatsAppNotification(notification, admin) {
  return `*${notification.title}*

Olá, ${admin.name || "Administrador"}!

${notification.message}

${formatNotificationDetails(notification.details, true)}

Atenciosamente,
Sistema de Monitoramento`;
}

/**
 * Formata detalhes da notificação
 * @param {Object} details Detalhes da notificação
 * @param {boolean} isWhatsApp Se é para WhatsApp
 * @returns {string} Detalhes formatados
 */
function formatNotificationDetails(details, isWhatsApp = false) {
  if (!details) return "";

  const format = isWhatsApp
    ? (key, value) => `*${key}:* ${value}`
    : (key, value) => `<strong>${key}:</strong> ${value}`;

  return Object.entries(details)
    .map(([key, value]) => format(key, value))
    .join(isWhatsApp ? "\n" : "<br>");
}

/**
 * Marca notificação como lida
 * @param {string} notificationId ID da notificação
 */
async function markAsRead(notificationId) {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) throw error;

    logger.info(`Notificação ${notificationId} marcada como lida`);
  } catch (error) {
    logger.error("Erro ao marcar notificação como lida:", error);
    throw error;
  }
}

module.exports = {
  createNotification,
  sendNotification,
  scheduleNotification,
  listNotifications,
  getNotificationDetails,
  cancelNotification,
  processScheduledNotifications,
  notifyAdmins,
  markAsRead,
};
