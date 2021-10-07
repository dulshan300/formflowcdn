(function () {   
    
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    firebase
        .auth()
        .signInWithEmailAndPassword(_femail, _fpass)
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
            member: null,
            is_valid: true,
            form_data: {
                beneficiary: null,
                beneficiary_sponsor: {},
                pay_amount: 0,
                email: "abavira@gmail.com",
                payment_ref: null,
                gender: "male",
                membership_no: null,
                start_date: new Date(),
                expires_date: null,
            },
            member: {
                id: null,
                status: null,
                product: null,
                plan: null,
                date_expires: null,
                other_name: null,
                surname: null,
            },
        },
        components: {
            Panel: panel(), // do not remove
        },
        watch: {
            selected_product: function (d) {
                if (d) {
                    var pd = d.split("-");
                    this.form_data.pay_amount = parseFloat(pd[2]);
                    console.log(this.selected_product);
                    for (const product of this.cosmo_products) {
                        if (product.tag == pd[0]) {
                            this.selected_product_name =
                                product.name +
                                " - " +
                                (pd[1] == "MP"
                                    ? "Monthly Plan"
                                    : "Annual Plan");
                        }
                    }
                    this.selected_plan = pd[3];
                }
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
                this.form_data = {
                    beneficiary: null,
                    beneficiary_sponsor: {},
                    pay_amount: 0,
                    email: "abavira@gmail.com",
                    payment_ref: null,
                    gender: "male",
                    membership_no: null,
                    start_date: new Date(),
                    expires_date: null,
                };
            },
            // Add your code below here
            say: function () {
                console.log("say awasome");
                return true;
            },
            validate_bdetails: function () {
                var valid = true;
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

            set_product: function () {
                var pd = this.member.product_code.split("-");
                this.selected_plan = pd[3];
                this.make_payment();
            },

            set_dates: function () {
                // check the state
                var dt = new Date();

                if (
                    this.member.status == "ACTIVE" &&
                    this.selected_product == this.member.product_code
                ) {
                    dt = new Date(this.member.date_expires);
                }

                // check anual or Monthly

                if (this.plan_tenor() == "Monthly") {
                    dt.setMonth(dt.getMonth() + 1);
                } else {
                    dt.setMonth(dt.getMonth() + 12);
                }

                this.member.date_expires = dt.toISOString().split("T")[0];
            },

            make_payment: async function (code = null) {
                let handler = PaystackPop.setup({
                    key: PUB_KEY, // Replace with your public key
                    email: app.member.email,
                    currency: "GHS",
                    channels:['card','bank','mobile_money'],
                    plan: app.selected_plan,
                    amount: app.form_data.pay_amount * 100,
                    ref: "CSMO" + Math.floor(Math.random() * 1000000000 + 1), // generates a pseudo-unique reference. Please replace with a reference you generated. Or remove the line entirely so our API will generate one for you
                    // label: "Optional string that replaces customer email"
                    onClose: function () {
                        return false;
                    },
                    callback: function (response) {
                        let message =
                            "Payment complete! Reference: " +
                            response.reference;
                        app.form_data.payment_ref = response.reference;
                        app.current_step = 4;
                        // send mails
                        app.mail();

                        (async function () {
                            app.set_dates();

                            app.member.product = app.plan_type();
                            app.member.plan = app.plan_tenor();
                            app.member.product_code = app.selected_product;
                            app.member.payment_ref = app.form_data.payment_ref;
                            await persons.doc(app.member.id).set(app.member);
                            console.log("Saved");
                        })();

                        return true;
                    },
                });
                handler.openIframe();
            },
            verify: async function () {
                // check user
                this.is_valid = true;
                if (this.form_data.membership_no != null) {
                    var doc = await persons
                        .where("pin", "==", this.form_data.membership_no)
                        .limit(1)
                        .get();
                    if (!doc.empty) {
                        this.member = doc.docs[0].data();
                        this.is_valid = true;
                        this.selected_product = this.member.product_code;
                        console.log(this.selected_product);
                        this.member.pay_amount = parseInt(
                            this.member.product_code.split("-")[2]
                        );
                        return true;
                    } else {
                        this.is_valid = false;
                        return false;
                    }
                } else {
                    this.is_valid = false;
                }
            },
            mail: async function () {
                var temp = $("#email_body").html();
                var template = Handlebars.compile(temp);
                var email_body_data = {
                    plan_name: this.selected_product_name,
                    mb_number: this.member.id,
                    payment_ref: this.form_data.payment_ref,
                    amount: this.form_data.pay_amount,
                    name: this.member.surname + " " + this.member.other_name,
                    expires_date: this.member.date_expires,
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

                form.append("_to[]", this.member.email);

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
                <button :disabled="dnext" type="button" class="btn btn-primary" v-on:click="next"> 
                <span v-if="processing" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                {{next_text}}</button>
            </div>
        </div>      
      </div>`,
            data: function () {
                return {
                    isBack: this.step == 1 ? false : true,
                    next_text: this.bnext ? this.bnext : "Next",
                    dnext: this.dnext ? this.dnext : false,
                    processing: false,
                };
            },
            methods: {
                next: async function () {
                    this.processing = true;
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
                    this.processing = false;
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
