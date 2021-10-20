(function () {
    
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    firebase
        .auth()
        .signInWithEmailAndPassword(_femail,_fpass)
        .then((userCredential) => {
            var user = userCredential.user;
            window.user = user;
            console.log(user);
        })
        .catch((error) => {
            console.log(error);
        });
    var db = firebase.firestore();
    var persons = db.collection("persons");
    var settings = db.collection("settings");

    var app = new Vue({
        el: "#app",
        data: {
            msg: "Hello Vue Wizard",
            current_step: 1, // do not remove
            total_step: 0, // do not remove
            // Add your code below here
            cosmo_products: _cosmo_products,
            selected_product: null,
            selected_plan: null,
            selected_product_name: null,
            settings: {},
            form_data: {
                beneficiary: null,
                beneficiary_sponsor: {},
                pay_amount: 10,
                email: null,
                payment_ref: null,
                gender: null,
                start_date: new Date(),
                expires_date: null,
                status: "ACTIVE",
                pin: ("000" + parseInt(Math.random(10, 10000) * 10000)).slice(
                    -4
                ),
                mb_number: null,
            },
        },
        components: {
            Panel: panel(), // do not remove
        },

        created: async function () {
            var settings_doc = await settings.doc("cosmo").get();
            this.settings = settings_doc.data();
            this.settings.last_member_id += 1;

            this.form_data.mb_number =
                "CHI" +
                ("00000000" + parseInt(this.settings.last_member_id)).slice(-8);

            while (true) {
                var doc = await persons
                    .where("pin", "==", this.form_data.pin)
                    .get();
                if (doc.exists) {
                    this.form_data.pin = (
                        "000" + parseInt(Math.random(10, 10000) * 10000)
                    ).slice(-4);
                    console.log(this.form_data.pin);
                } else {
                    console.log(this.form_data.pin);
                    break;
                }
            }
        },
        watch: {
            selected_product: async function (d) {
                var pd = d.split("-");
                this.form_data.pay_amount = parseFloat(pd[2]);
                console.log(this.selected_product);
                for (const product of this.cosmo_products) {
                    if (product.tag == pd[0]) {
                        this.selected_product_name =
                            product.name +
                            " - " +
                            (pd[1] == "MP" ? "Monthly Plan" : "Annual Plan");
                    }
                }
                this.selected_plan = pd[3];
                this.form_data.expires_date = new Date();
                pd[1] == "MP"
                    ? this.form_data.expires_date.setDate(
                          this.form_data.expires_date.getDate() + 30
                      )
                    : this.form_data.expires_date.setDate(
                          this.form_data.expires_date.getDate() + 365
                      );

                // console.log(mysetting);
                // mysetting.last_pin++;
                // await db.collection("settings").doc("cosmo").set(mysetting);
            },
        },

        methods: {
            // step_finish will execute as the last step next function
            // do not remove
            step_finish: function () {
                console.log("Last step");
                this.current_step = 1;
                app.data_reset();
            },

            data_reset: function () {
                this.form_data = {};
            },
            // Add your code below here
            say: function () {
                console.log("say awasome");
                return true;
            },
            validate_bdetails_1: function () {
                var valid = true;
                if (this.form_data.beneficiary == "Family_or_Friends") {
                    $("#bdetails2 input[required]").each(function () {
                        $(this).removeClass("error");
                        if ($(this).val() == "" || $(this).val() == null) {
                            $(this).addClass("error");
                            valid = false;
                        }
                        console.log(this.type);
                        if (this.type == "email") {
                            var re =
                                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                            if (!re.test($(this).val())) {
                                $(this).addClass("error");
                                valid = false;
                            }
                        }
                    });
                }

                return valid;
            },
            validate_bdetails: function () {
                var valid = true;
                $(".custom-radio").removeClass("error");
                $("#bdetails input[required],#bdetails select[required]").each(
                    function () {
                        $(this).removeClass("error");
                        if ($(this).val() == "" || $(this).val() == null) {
                            $(this).addClass("error");
                            valid = false;
                        }
                        if (this.type == "email") {
                            var re =
                                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                            if (!re.test($(this).val())) {
                                $(this).addClass("error");
                                valid = false;
                            }
                        }
                    }
                );

                if (app.form_data.gender == null) {
                    $(".custom-radio").addClass("error");
                    valid = false;
                }
                return valid;
            },
            plan_type: function () {
                if (this.selected_product) {
                    var plan = this.selected_product.split("-");
                    for (const pro of this.cosmo_products) {
                        if (pro.tag === plan[0]) {
                            return pro.name;
                        }
                    }
                }
                return "";
            },
            plan_tenor: function () {
                if (this.selected_product) {
                    var plan = this.selected_product.split("-");
                    return plan[1] == "MP" ? "Monthly" : "Annually";
                }
                return "";
            },
            make_payment: async function () {
                let handler = PaystackPop.setup({
                    key: PUB_KEY, // Replace with your public key
                    email: this.form_data.email,
                    currency: "GHS",                    
                    // plan: app.selected_plan, 
                    channels:['card', 'bank','mobile_money'],
                    amount: this.form_data.pay_amount * 100,
                    ref: "CSMO" + Math.floor(Math.random() * 1000000000 + 1), // generates a pseudo-unique reference. Please replace with a reference you generated. Or remove the line entirely so our API will generate one for you
                    // label: "Optional string that replaces customer email"
                    onClose: function () {
                        return false;
                    },
                    callback: function (response) {
                        app.form_data.payment_ref = response.reference;
                        app.current_step = 5;

                        // send mails
                        app.mail();
                        app.mail_user();

                        // save data

                        var xdata = {
                            surname: app.form_data.surname,
                            other_name: app.form_data.other_names,
                            beneficiary: app.form_data.beneficiary,
                            beneficiary_sponsor:
                                app.form_data.beneficiary_sponsor,
                            email: app.form_data.email,
                            gender: app.form_data.gender,
                            date_start: app.form_data.start_date
                                .toISOString()
                                .split("T")[0],
                            date_expires: app.form_data.expires_date
                                .toISOString()
                                .split("T")[0],
                            status: app.form_data.status,
                            pin: app.form_data.pin,
                            id: app.form_data.mb_number,
                            product: app.plan_type(),
                            plan: app.plan_tenor(),
                            dob: app.form_data.date_of_birth,
                            gender: app.form_data.gender,
                            phone: app.form_data.phone_number,
                            id_type: app.form_data.id_type,
                            id_number: app.form_data.id_number,
                            payment_ref: app.form_data.payment_ref,
                            product_code: app.selected_product,
                        };

                        console.log(xdata.id);

                        (async function () {
                            await persons.doc(xdata.id).set(xdata);
                            await settings.doc("cosmo").set(app.settings);
                            console.log("Saved");
                        })();
                    },
                });
                handler.openIframe();
            },
            mail: async function () {
                var temp = $("#email_body").html();
                var template = Handlebars.compile(temp);
                var email_body_data = {
                    plan_name: this.selected_product_name,
                    b_type: this.form_data.beneficiary,
                    s_name: this.form_data.beneficiary_sponsor.name,
                    s_phone: this.form_data.beneficiary_sponsor.phone,
                    s_email: this.form_data.beneficiary_sponsor.email,
                    su_name: this.form_data.surname,
                    o_name: this.form_data.other_names,
                    dob: this.form_data.date_of_birth,
                    gender: this.form_data.gender,
                    p_number: this.form_data.phone_number,
                    email: this.form_data.email,
                    id_type: this.form_data.id_type,
                    id_number: this.form_data.id_number,
                    payment_ref: this.form_data.payment_ref,
                    amount: this.form_data.pay_amount,
                    mb_number: this.form_data.mb_number,
                    pin: "-",
                    expires_date: app.form_data.expires_date
                        .toISOString()
                        .split("T")[0],
                };
                // console.log(template(email_body_data));
                var form = new FormData();
                form.append("_api_key", EMAIL_API.public_key);
                form.append("_from", EMAIL_API.from[0]);
                form.append("_from_name", EMAIL_API.from[1]);
                form.append("_subject", EMAIL_API.subject);
                form.append("_sg_key", EMAIL_API.sendgrid_key);
                for (const to of EMAIL_API.to) {
                    form.append("_to[]", to);
                }

                form.append("_body", template(email_body_data));
                $.ajax({
                    url: EMAIL_API.api_url,
                    method: "POST",
                    data: form,
                    processData: false,
                    contentType: false,
                    crossDomain: true,
                    // dataType: "json",
                    success: function (data) {
                        // console.log(data);
                    },
                });
            },

            mail_user: function () {
                var temp = $("#email_body").html();
                var template = Handlebars.compile(temp);
                var email_body_data = {
                    plan_name: this.selected_product_name,
                    b_type: this.form_data.beneficiary,
                    s_name: this.form_data.beneficiary_sponsor.name,
                    s_phone: this.form_data.beneficiary_sponsor.phone,
                    s_email: this.form_data.beneficiary_sponsor.email,
                    su_name: this.form_data.surname,
                    o_name: this.form_data.other_names,
                    dob: this.form_data.date_of_birth,
                    gender: this.form_data.gender,
                    p_number: this.form_data.phone_number,
                    email: this.form_data.email,
                    id_type: this.form_data.id_type,
                    id_number: this.form_data.id_number,
                    payment_ref: this.form_data.payment_ref,
                    amount: this.form_data.pay_amount,
                    mb_number: this.form_data.mb_number,
                    pin: this.form_data.pin,
                    expires_date: app.form_data.expires_date
                        .toISOString()
                        .split("T")[0],
                };
                // console.log(template(email_body_data));
                var form = new FormData();
                form.append("_api_key", EMAIL_API.public_key);
                form.append("_from", EMAIL_API.from[0]);
                form.append("_from_name", EMAIL_API.from[1]);
                form.append(
                    "_subject",
                    "COSMO PRODUCT: Thank you for Registering with Us"
                );
                form.append("_sg_key", EMAIL_API.sendgrid_key);

                form.append("_to[]", this.form_data.email);

                form.append("_body", template(email_body_data));
                $.ajax({
                    url: EMAIL_API.api_url,
                    method: "POST",
                    data: form,
                    processData: false,
                    contentType: false,
                    crossDomain: true,
                    // dataType: "json",
                    success: function (data) {
                        // console.log(data);
                    },
                });
            },
        },
    });
    // Panel Component
    function panel() {
        // Panel Component
        var panel = {
            props: ["step", "title", "action", "bnext", "dnext"],
            template: `<div :data-step="step" v-if="$parent.current_step==step" class="vue-panel card">     
        <div class="card-body">
            <div v-if="title">
                <h5 class="text-center">{{title}}</h5>
                <hr>
            </div>
            <div><slot></slot></div>
            <hr>
            <div class="d-flex justify-content-center">
                <button type="button" class="btn btn-secondary mr-1" v-if="isBack" v-on:click="back">Back</button>
                <button :disabled="dnext" type="button" class="btn btn-primary" v-on:click="next">{{next_text}}</button>
            </div>
        </div>      
      </div>`,
            data: function () {
                return {
                    isBack: this.step == 1 ? false : true,
                    next_text: this.bnext ? this.bnext : "Next",
                    dnext: this.dnext ? this.dnext : false,
                };
            },
            methods: {
                next: async function () {
                    if (this.action) {
                        if (await this.$parent[this.action]()) {
                            if (
                                this.$parent.current_step ==
                                this.$parent.total_step
                            ) {
                                this.$parent.step_finish();
                            } else {
                                this.$parent.current_step++;
                            }
                        }
                    } else {
                        if (
                            this.$parent.current_step == this.$parent.total_step
                        ) {
                            this.$parent.step_finish();
                        } else {
                            this.$parent.current_step++;
                        }
                    }
                    console.log(this.$parent.total_step);
                },
                back: function () {
                    this.$parent.current_step--;
                },
            },
            created: function () {
                this.$parent.total_step += 1;
                console.log("Panel Created");
            },
        };
        return panel;
    }
    // End Panel Component
})();
