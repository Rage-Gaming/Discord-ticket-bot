const { ActionRowBuilder, ChannelType , ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionsBitField } = require('discord.js');
const { createTranscript } = require('discord-html-transcripts');

/**
 * @param {Client} client
*/

module.exports = async (client) => {
    client.on("interactionCreate", async (interaction) => {
        let setupChannel = client.channels.cache.get(process.env.TicketSetUpChannel)
        if (!setupChannel) return;
        if (interaction.commandName == "setupticket") {
            let hasRole = interaction.member.roles.cache.has(process.env.AdminRoleID);
            if (hasRole) {

                let btnrow = new ActionRowBuilder().addComponents([
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Success)
                        .setCustomId("ap_createticket")
                        .setLabel("Create Support Ticket")
                        .setEmoji("📑"),
                ]);
                setupChannel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`DHRUVAM Support Ticket`)
                            .setAuthor({ name: `${process.env.ServerName}`, iconURL: process.env.ServerLogo })
                            .setColor("#00e5ff")
                            .setThumbnail(process.env.Thumbnail)
                            .setImage(process.env.Image)
                            .setFooter({ text: "Ticket" ? `${process.env.ServerName}` : `${process.env.ServerName}` })
                            .setTimestamp(new Date())
                    ],
                    components: [btnrow],
                });

                interaction.reply({
                    content: `> Setup in ${setupChannel}`,
                });

            } else {
                interaction.reply({
                    content: `You don't have the privilage to do this command contact Admins for more information`,
                    ephemeral: true,
                });
            }
        } else if (interaction.isButton()) {
            if (interaction.customId == "ap_createticket") {
                let support_ticket_modal = new ModalBuilder()
                    .setTitle(`Support Ticket`)
                    .setCustomId(`support_ticket_modal`);

                const user_reason = new TextInputBuilder()
                    .setCustomId("ap_ticketreason")
                    .setLabel(`Why you want to create the ticket?`.substring(0, 45))
                    .setMinLength(6)
                    .setMaxLength(1000)
                    .setRequired(true)
                    .setPlaceholder(`Enter your reason to create the ticket`)
                    .setStyle(TextInputStyle.Paragraph);

                let row_ticketreason = new ActionRowBuilder().addComponents(user_reason);
                support_ticket_modal.addComponents(row_ticketreason);

                try {
                    await interaction.showModal(support_ticket_modal);
                } catch (error) {
                    interaction.reply({
                        content: `> There was an error : ${error}`,
                    });
                }
            } else if (interaction.customId == "ticket_close") {
                let ticket_close_confirm_button = new ActionRowBuilder().addComponents([
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Success)
                        .setCustomId("ticket_close_confirm")
                        .setLabel("Ok")
                        .setEmoji("⌛"),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Danger)
                        .setCustomId("ticket_close_reject")
                        .setLabel("Cancel")
                        .setEmoji("✖️"),
                ]);
                interaction.reply({
                    content: `Are you sure want to delete the ticket`,
                    components: [ticket_close_confirm_button]
                })
            } else if (interaction.customId == "ticket_close_confirm") {
                const channel = client.channels.cache.get(interaction.channel.id);
                channel.send({
                    content: `Ticket will be closed in 5 seconds`
                });
                setTimeout(() => {
                    channel.delete();
                }, 5000);
            } else if (interaction.customId == "ticket_close_reject") {
                interaction.reply({
                    content: `${interaction.reference.messageId}`
                })
                console.log(interaction);
            } else if (interaction.customId == "ticket_transcript") {
                if (!process.env.TranscriptChannelID) return interaction.reply({
                    content: `Transcript channel is not set up. Please set it up in the env file.`,
                    ephemeral: true,
                });
                if (interaction.user.cache.has(process.env.AdminRoleID)) {
                    const channel = interaction.channel;

                    const attachment = await createTranscript(channel, {
                        limit: -1,
                        returnType: 'attachment',
                        filename: `${interaction.channel.name}.html`,
                    });

                    const anotherChannel = interaction.guild.channels.cache.get(process.env.TranscriptChannelID);
                    anotherChannel.send({
                        content: `Ticket transcript taken by <@${interaction.user.id}>`,
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('DHRUVAM Transcript')
                                .setAuthor({ name: 'DHRUVAM', iconURL: process.env.ServerLogo })
                                .setColor(5763719)
                                .setThumbnail(process.env.Thumbnail)
                                .setFooter({ text: 'DHRUVAM', icon_url: process.env.ServerLogo })
                                .addFields([
                                    {
                                        name: '\n\u200b\nTicket Name',
                                        value: `\`\`\`${interaction.channel.name}\`\`\``,
                                        inline: false
                                    },

                                ])
                                .setTimestamp(new Date())
                        ],
                        files: [attachment],
                    });

                    await interaction.reply({
                        content: `Transcript has been sent to <#${process.env.TranscriptChannelID}>`,
                        ephemeral: true,
                    });
                }
            }

        } else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'support_ticket_modal') {
                const guild = client.guilds.cache.get(process.env.GuildID);
                const categoryId = process.env.TicketCategoryID;
                const channel = await interaction.guild.channels.create({
                    name: `support-${interaction.user.username}`,
                    type: ChannelType.GuildText,
                    reason: `Support Ticket created by ${interaction.user.username}`,
                    parent: categoryId,
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone,
                            deny: [
                                PermissionsBitField.Flags.ViewChannel
                            ],
                        },
                        {
                            id: interaction.user.id,
                            allow: [
                                PermissionsBitField.Flags.ViewChannel,
                                PermissionsBitField.Flags.SendMessages,
                                PermissionsBitField.Flags.AttachFiles,
                                PermissionsBitField.Flags.ReadMessageHistory
                            ],
                            deny: [
                                PermissionsBitField.Flags.AddReactions,
                                PermissionsBitField.Flags.EmbedLinks,
                                PermissionsBitField.Flags.MentionEveryone,
                                PermissionsBitField.Flags.UseApplicationCommands,
                                PermissionsBitField.Flags.UseExternalStickers,
                                PermissionsBitField.Flags.CreatePublicThreads
                            ]
                        }
                    ],
                });

                let ticketReason = interaction.fields.getTextInputValue("ap_ticketreason");
                let btnrow = new ActionRowBuilder().addComponents([
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Success)
                        .setCustomId("ticket_transcript")
                        .setLabel("Transcript")
                        .setEmoji("⌛"),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Danger)
                        .setCustomId("ticket_close")
                        .setLabel("Close")
                        .setEmoji("✖️"),
                ]);

                const sentMessage = await channel.send({
                    content: `Support ticket by <@${interaction.user.id}> \n<@&1048119915707650118> <@&1130791882558025728> <@&981442795229306912>`,
                    embeds: [
                        new EmbedBuilder()
                            .setAuthor({ name: `${process.env.ServerName} | Support Ticket`, iconURL: process.env.ServerLogo })
                            .setColor("Blue")
                            .setThumbnail(process.env.ServerLogo)
                            .setFooter({ text: "TICKET" ? `${process.env.ServerName}` : `${process.env.ServerName}` })
                            .setTimestamp(new Date())
                            .setTitle(`TICKET`)
                            .addFields([
                                {
                                    name: '\n\u200b\nTicket Reason',
                                    value: `\`\`\`${ticketReason}\`\`\``,
                                    inline: false
                                },
                            ])
                            .setFooter({
                                text: `${interaction.user.id}`,
                                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                            }),
                    ],
                    components: [btnrow],
                });

                await sentMessage.pin();
                
                await channel.setTopic(`Support ticket created by ${interaction.user.username} for the reason: ${ticketReason}`);
                interaction.reply({
                    content: `Your ticket has been created ${channel}`,
                    ephemeral: true,
                });
            }
        }
    });
};